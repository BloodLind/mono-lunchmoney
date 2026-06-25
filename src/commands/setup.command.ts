import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type {
  AppConfig,
  AccountMapping,
  IgnoredMonobankAccount
} from "../config/config.model.js";
import { hhmmSchema } from "../config/config.model.js";
import { loadConfig } from "../config/config.loader.js";
import { resolveRuntimePaths } from "../config/paths.js";
import {
  LUNCH_MONEY_API_DOCS_URL,
  LUNCH_MONEY_TOKEN_URL,
  MONOBANK_TOKEN_URL,
  createDefaultCredentialStore,
  saveProviderTokensToProtectedStorage,
  sourceLabel,
  type ProviderTokenEnvironment,
  type ProviderTokens
} from "../config/tokens.js";
import type { CredentialStore } from "../credentials/credential-store.js";
import {
  PROVIDERS,
  PROVIDER_DISPLAY_NAMES,
  PROVIDER_ENV_KEYS,
  type ProviderName,
  type ProviderTokenSources
} from "../credentials/credential-types.js";
import { writeConfig } from "../config/config.writer.js";
import type { BudgetAccount, BudgetProvider } from "../lunchmoney/lunchmoney-types.js";
import { LunchMoneyV1Client } from "../lunchmoney/lunchmoney-v1-client.js";
import { MonobankClient, flattenMonobankSources } from "../monobank/mono-client.js";
import type { MonoClientInfo, MonobankSource } from "../monobank/mono-types.js";
import { minorUnitsToDecimalString } from "../utils/money.js";
import { maskLongIdentifier, sanitizeText, sha256Hex } from "../utils/masking.js";
import { formatDateOnly, parseFlexibleLocalDate } from "../utils/date.js";
import {
  CliError,
  DEFAULT_DAILY_AT,
  DEFAULT_TAG,
  DEFAULT_TASK_NAME,
  EXIT_CODES
} from "../cli/command-registry.js";
import { disableNotifications, enableNotifications } from "../notifications/notification-config.js";
import { createCommandUi } from "../cli/ui.js";
import {
  installScheduledTask,
  type ScheduledCommand,
  type SchedulerOptions
} from "../scheduler/windows-task-scheduler.js";

export type SetupOptions = {
  config?: string;
  reconfigure?: boolean;
};

export type PromptFunction = (question: string) => Promise<string>;

export type SetupDeps = {
  env?: NodeJS.ProcessEnv;
  stdout?: Pick<NodeJS.WriteStream, "write">;
  prompt?: PromptFunction;
  monoClient?: Pick<MonobankClient, "getClientInfo">;
  budgetProvider?: BudgetProvider;
  credentialStore?: CredentialStore;
  installSchedulerTask?: (options: SchedulerOptions) => Promise<ScheduledCommand>;
};

type SetupTokenResolution = ProviderTokens & {
  sources: ProviderTokenSources;
  tokensToSave: ProviderTokenEnvironment;
  shouldSave: boolean;
};

function writeLine(deps: SetupDeps, text: string): void {
  (deps.stdout ?? output).write(`${text}\n`);
}

export async function runSetupCommand(options: SetupOptions, deps: SetupDeps = {}): Promise<void> {
  const ui = createCommandUi(deps.env);
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const existingConfig = loadConfig(paths.configPath);
  if (existingConfig.exists && !options.reconfigure) {
    throw new CliError(
      `Config already exists: ${paths.configPath}. Use setup --reconfigure to replace it.`,
      EXIT_CODES.USER_ERROR
    );
  }

  const promptResource = deps.prompt ? undefined : createPromptResource();
  const prompt = deps.prompt ?? promptResource!.prompt;

  try {
    writeLine(deps, ui.title("Mono Lunch Money Setup"));
    writeLine(deps, "");

    const tokenResolution = await resolveSetupTokens(prompt, deps);
    const monoClient = deps.monoClient ?? new MonobankClient(tokenResolution.monoToken);
    const budgetProvider =
      deps.budgetProvider ?? new LunchMoneyV1Client(tokenResolution.lunchMoneyToken);

    writeLine(deps, "");
    writeLine(deps, ui.section("Provider Checks"));
    writeLine(deps, ui.bullet(`Connecting to ${ui.value("Monobank")}...`));
    const clientInfo = await monoClient.getClientInfo();
    const sources = flattenMonobankSources(clientInfo as MonoClientInfo);
    if (sources.length === 0) {
      throw new Error("No Monobank accounts/cards were found.");
    }

    writeLine(deps, ui.bullet(`Connecting to ${ui.value("Lunch Money")}...`));
    const assets = await budgetProvider.listAccounts();

    if (tokenResolution.shouldSave && Object.keys(tokenResolution.tokensToSave).length > 0) {
      const credentialStore =
        deps.credentialStore ?? createDefaultCredentialStore(deps.env ?? process.env);
      await saveProviderTokensToProtectedStorage(tokenResolution.tokensToSave, credentialStore);
      writeLine(deps, ui.success("Saved provider tokens to protected storage for this Windows user."));
    } else if (Object.keys(tokenResolution.tokensToSave).length > 0) {
      writeLine(
        deps,
        ui.warning(
          "Tokens were used for this setup run only. Run mono-lunchmoney credentials set before sync or scheduler."
        )
      );
    }

    writeLine(deps, "");
    writeLine(deps, ui.section("Credential Sources"));
    for (const provider of PROVIDERS) {
      writeLine(
        deps,
        ui.bullet(
          `${PROVIDER_DISPLAY_NAMES[provider]}: ${ui.value(sourceLabel(tokenResolution.sources[provider]))}`
        )
      );
    }

    writeLine(deps, "");
    writeLine(deps, ui.section("Found Monobank accounts/cards"));
    sources.forEach((source, index) => {
      writeLine(deps, formatSourceChoice(source, index + 1, ui));
    });

    const defaultTag = (await askWithDefault(prompt, "Default transaction tag", DEFAULT_TAG)).trim();
    const baselineDate = await askOptionalDate(
      deps,
      prompt,
      "Baseline date (optional, examples: 2026-05-01, 01.05.2026, May 1 2026, yesterday)"
    );
    const notifications = (await askYesNo(prompt, "Enable Windows notifications?"))
      ? enableNotifications({
          success: await askYesNo(prompt, "Notify on successful sync/backfill?")
        })
      : disableNotifications();
    const accounts: AccountMapping[] = [];
    const ignoredMonobankAccounts: IgnoredMonobankAccount[] = [];

    for (const source of sources) {
      writeLine(deps, "");
      const shouldTrack = await askYesNo(prompt, `Track ${formatSource(source)} for Lunch Money import?`);
      if (shouldTrack) {
        const asset = await chooseOrCreateAsset(source, assets, budgetProvider, prompt, deps);
        const tag = (await askWithDefault(prompt, `Transaction tag for ${source.displayName}`, defaultTag)).trim();
        accounts.push({
          enabled: true,
          monoAccountId: source.accountId,
          monoDisplayName: source.displayName,
          monoType: source.type,
          monoCurrencyCode: source.currencyCode,
          currency: source.currency,
          lunchMoneyAssetId: asset.id,
          lunchMoneyAccountName: asset.name,
          tag,
          externalIdPrefix: `mono:${source.accountId}`
        });
      }
      if (await askYesNo(prompt, `Ignore transfers involving ${formatSource(source)}?`)) {
        ignoredMonobankAccounts.push(toIgnoredMonobankAccount(source));
      }
    }

    const schedulerSetup = await askSchedulerSetup(prompt);

    const config: AppConfig = {
      schemaVersion: 1,
      lunchMoneyApiVersion: "v1",
      lookbackDays: 31,
      skipBalanceUpdate: false,
      baselineDate,
      defaultTag,
      notifications,
      ignoredMonobankAccounts,
      accounts
    };

    await writeConfig(paths.configPath, config);

    let scheduledCommandLine: string | undefined;
    if (schedulerSetup) {
      const scheduled = await (deps.installSchedulerTask ?? installScheduledTask)({
        dailyAt: schedulerSetup.dailyAt,
        taskName: schedulerSetup.taskName,
        configPath: paths.configPath,
        appDataDirectory: paths.appDataDirectory
      });
      config.scheduler = {
        enabled: true,
        type: "windows-task-scheduler",
        dailyAt: schedulerSetup.dailyAt,
        taskName: schedulerSetup.taskName
      };
      await writeConfig(paths.configPath, config);
      scheduledCommandLine = scheduled.commandLine;
    }

    writeLine(deps, "");
    writeLine(deps, ui.section("Saved Configuration"));
    for (const line of ui.keyValues([
      { label: "Config path", value: paths.configPath },
      { label: "Baseline date", value: baselineDate ?? "not set", tone: baselineDate ? "normal" : "muted" },
      { label: "Notifications", value: notifications.enabled ? "enabled" : "disabled", tone: notifications.enabled ? "success" : "muted" },
      {
        label: "Scheduler",
        value: config.scheduler?.enabled ? `${config.scheduler.dailyAt} (${config.scheduler.taskName})` : "not installed",
        tone: config.scheduler?.enabled ? "success" : "muted"
      },
      {
        label: "Ignored transfer sources",
        value: ignoredMonobankAccounts.length,
        tone: ignoredMonobankAccounts.length > 0 ? "warning" : "muted"
      },
      { label: "Tracked mappings", value: accounts.length, tone: accounts.length > 0 ? "success" : "warning" }
    ])) {
      writeLine(deps, line);
    }
    if (scheduledCommandLine) {
      writeLine(deps, ui.bullet(`Scheduled command: ${ui.command(scheduledCommandLine)}`));
    }
    if (accounts.length > 0) {
      writeLine(deps, "");
      writeLine(deps, ui.section("Mappings"));
      for (const account of accounts) {
        writeLine(
          deps,
          ui.bullet(
            `${sanitizeText(account.monoDisplayName)} ${ui.muted("->")} ${sanitizeText(
              account.lunchMoneyAccountName
            )} ${ui.muted(`(${sanitizeText(maskLongIdentifier(account.externalIdPrefix))})`)}`
          )
        );
      }
    }
    if (ignoredMonobankAccounts.length > 0) {
      writeLine(deps, "");
      writeLine(deps, ui.section("Ignored Transfer Sources"));
      for (const account of ignoredMonobankAccounts) {
        writeLine(
          deps,
          ui.bullet(`${sanitizeText(account.monoDisplayName)} ${ui.muted(`(${account.currency.toUpperCase()})`)}`)
        );
      }
    }
  } finally {
    promptResource?.close();
  }
}

function toIgnoredMonobankAccount(source: MonobankSource): IgnoredMonobankAccount {
  return {
    enabled: true,
    monoAccountId: source.accountId,
    monoDisplayName: source.displayName,
    monoType: source.type,
    monoCurrencyCode: source.currencyCode,
    currency: source.currency,
    maskedPan: source.maskedPan,
    ibanSha256: source.maskedIban ? sha256Hex(source.maskedIban) : undefined
  };
}

async function resolveSetupTokens(
  prompt: PromptFunction,
  deps: SetupDeps
): Promise<SetupTokenResolution> {
  const ui = createCommandUi(deps.env);
  const env = deps.env ?? process.env;
  const credentialStore = deps.credentialStore ?? createDefaultCredentialStore(env);
  const tokens: Partial<Record<ProviderName, string>> = {};
  const sources: Partial<ProviderTokenSources> = {};
  const tokensToSave: ProviderTokenEnvironment = {};

  writeLine(deps, ui.section("API Tokens"));
  writeLine(
    deps,
    ui.muted("Tokens validate setup, can be saved to protected storage, and are never written to config.json.")
  );

  for (const provider of PROVIDERS) {
    const read = await credentialStore.readCredential(provider);
    if (read.success) {
      tokens[provider] = read.secret.trim();
      sources[provider] = "protected-storage";
      writeLine(
        deps,
        ui.bullet(`${PROVIDER_DISPLAY_NAMES[provider]}: using ${ui.value("protected storage")}.`)
      );
      continue;
    }

    if (read.source === "inaccessible") {
      writeLine(deps, ui.warning(read.message));
    }

    const envKey = PROVIDER_ENV_KEYS[provider];
    const envToken = env[envKey]?.trim();
    if (envToken) {
      tokens[provider] = envToken;
      sources[provider] = "environment";
      tokensToSave[envKey] = envToken;
      writeLine(
        deps,
        ui.bullet(
          `${PROVIDER_DISPLAY_NAMES[provider]}: using ${ui.value(envKey)} from environment; setup can migrate it to protected storage.`
        )
      );
      continue;
    }

    writeLine(deps, ui.bullet(tokenGuidance(provider, ui)));
    const entered = await askRequired(prompt, `Paste ${PROVIDER_DISPLAY_NAMES[provider]} API token`, deps);
    tokens[provider] = entered;
    sources[provider] = "entered-now";
    tokensToSave[envKey] = entered;
  }

  const shouldSave =
    Object.keys(tokensToSave).length > 0
      ? await askYesNoDefault(
          prompt,
          "Save validated token(s) to protected storage for future sync/scheduler?",
          true
        )
      : false;

  return {
    monoToken: tokens.monobank!,
    lunchMoneyToken: tokens.lunchmoney!,
    sources: {
      monobank: sources.monobank ?? "missing",
      lunchmoney: sources.lunchmoney ?? "missing"
    },
    tokensToSave,
    shouldSave
  };
}

function tokenGuidance(provider: ProviderName, ui: ReturnType<typeof createCommandUi>): string {
  if (provider === "monobank") {
    return `Monobank: open ${ui.command(MONOBANK_TOKEN_URL)} and copy your personal API token.`;
  }
  return `Lunch Money: open ${ui.command(
    LUNCH_MONEY_TOKEN_URL
  )} and copy a developer API token. Docs: ${ui.command(LUNCH_MONEY_API_DOCS_URL)}`;
}

function createPromptResource(): { prompt: PromptFunction; close: () => void } {
  const rl = createInterface({ input, output });
  return {
    prompt: async (question: string) => rl.question(`${question}\n> `),
    close: () => rl.close()
  };
}

async function askWithDefault(
  prompt: PromptFunction,
  question: string,
  defaultValue: string
): Promise<string> {
  const answer = await prompt(`${question} [${defaultValue}]`);
  return answer.trim() || defaultValue;
}

async function askRequired(
  prompt: PromptFunction,
  question: string,
  deps: SetupDeps
): Promise<string> {
  const ui = createCommandUi(deps.env);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const answer = (await prompt(question)).trim();
    if (answer) {
      return answer;
    }
    writeLine(deps, ui.warning("A token value is required."));
  }
  throw new CliError(`${question} is required.`, EXIT_CODES.USER_ERROR);
}

async function askYesNo(prompt: PromptFunction, question: string): Promise<boolean> {
  while (true) {
    const answer = (await prompt(`${question} yes/no`)).trim().toLowerCase();
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no", ""].includes(answer)) return false;
  }
}

async function askYesNoDefault(
  prompt: PromptFunction,
  question: string,
  defaultValue: boolean
): Promise<boolean> {
  while (true) {
    const answer = (
      await prompt(`${question} yes/no [${defaultValue ? "yes" : "no"}]`)
    )
      .trim()
      .toLowerCase();
    if (!answer) return defaultValue;
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no"].includes(answer)) return false;
  }
}

async function askSchedulerSetup(
  prompt: PromptFunction
): Promise<{ dailyAt: string; taskName: string } | undefined> {
  if (!(await askYesNo(prompt, "Install daily Windows scheduled sync task now?"))) {
    return undefined;
  }

  while (true) {
    const dailyAt = await askWithDefault(prompt, "Daily sync time", DEFAULT_DAILY_AT);
    const parsed = hhmmSchema.safeParse(dailyAt.trim());
    if (parsed.success) {
      return {
        dailyAt: parsed.data,
        taskName: DEFAULT_TASK_NAME
      };
    }
  }
}

async function askOptionalDate(
  deps: SetupDeps,
  prompt: PromptFunction,
  question: string
): Promise<string | undefined> {
  const ui = createCommandUi(deps.env);
  while (true) {
    const answer = (await prompt(question)).trim();
    if (!answer) {
      return undefined;
    }
    try {
      return formatDateOnly(parseFlexibleLocalDate(answer));
    } catch {
      writeLine(
        deps,
        ui.warning("Could not understand that date. Try 2026-05-01, 01.05.2026, May 1 2026, or leave blank.")
      );
    }
  }
}

async function chooseOrCreateAsset(
  source: MonobankSource,
  assets: BudgetAccount[],
  budgetProvider: BudgetProvider,
  prompt: PromptFunction,
  deps: SetupDeps
): Promise<BudgetAccount> {
  const ui = createCommandUi(deps.env);
  writeLine(deps, ui.section("Lunch Money Mapping"));
  assets.forEach((asset, index) => {
    writeLine(
      deps,
      ui.choice(
        index + 1,
        sanitizeText(asset.name),
        `${asset.currency.toUpperCase()}${asset.typeName ? ` | ${asset.typeName}` : ""}`
      )
    );
  });
  writeLine(deps, ui.choice(assets.length + 1, "Create new Lunch Money account"));

  while (true) {
    const choice = Number((await prompt("Account choice")).trim());
    if (Number.isInteger(choice) && choice >= 1 && choice <= assets.length) {
      return assets[choice - 1];
    }
    if (choice === assets.length + 1) {
      break;
    }
    writeLine(deps, ui.warning(`Choose a number from 1 to ${assets.length + 1}.`));
  }

  const proposedName = source.displayName.replace(/\s+\*+\d+$/, "").trim() || "Monobank";
  const name = await askWithDefault(prompt, "Create Lunch Money account name", proposedName);
  const typeAnswer = await askWithDefault(prompt, "Account type cash/credit", "cash");
  const typeName = typeAnswer.toLowerCase() === "credit" ? "credit" : "cash";
  const balance =
    source.balanceMinor === undefined
      ? undefined
      : minorUnitsToDecimalString(source.balanceMinor, source.currency);
  const created = await budgetProvider.createAccount({
    name,
    currency: source.currency,
    balance,
    typeName,
    institutionName: "Monobank"
  });
  assets.push(created);
  return created;
}

function formatSource(source: MonobankSource): string {
  const balance =
    source.balanceMinor === undefined
      ? ""
      : ` | balance ${minorUnitsToDecimalString(source.balanceMinor, source.currency)} ${source.currency.toUpperCase()}`;
  return sanitizeText(`${source.displayName}${balance}`);
}

function formatSourceChoice(source: MonobankSource, index: number, ui: ReturnType<typeof createCommandUi>): string {
  const details = [
    source.type ? source.type.toUpperCase() : undefined,
    source.currency.toUpperCase(),
    source.balanceMinor === undefined
      ? undefined
      : `balance ${minorUnitsToDecimalString(source.balanceMinor, source.currency)} ${source.currency.toUpperCase()}`
  ]
    .filter(Boolean)
    .join(" | ");
  return ui.choice(index, sanitizeText(source.displayName), details);
}

export function createSetupCommand(): Command {
  return new Command("setup")
    .description("Interactive setup for Monobank and Lunch Money mappings")
    .option("--config <path>", "explicit config path")
    .option("--reconfigure", "update existing mappings")
    .action((options: SetupOptions) => runSetupCommand(options));
}
