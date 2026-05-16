import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { AppConfig, AccountMapping } from "../config/config.model.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { resolveProviderTokens } from "../config/tokens.js";
import { writeConfig } from "../config/config.writer.js";
import type { BudgetProvider } from "../lunchmoney/budget-provider.js";
import type { BudgetAccount } from "../lunchmoney/lunchmoney-types.js";
import { LunchMoneyV1Client } from "../lunchmoney/lunchmoney-v1-client.js";
import { MonobankClient, flattenMonobankSources } from "../monobank/mono-client.js";
import type { MonoClientInfo, MonobankSource } from "../monobank/mono-types.js";
import { minorUnitsToDecimalString } from "../utils/money.js";
import { maskLongIdentifier, sanitizeText } from "../utils/masking.js";
import { parseLocalDate } from "../utils/date.js";
import { DEFAULT_TAG } from "../cli/command-registry.js";
import { disableNotifications, enableNotifications } from "../notifications/notification-config.js";

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
};

function writeLine(deps: SetupDeps, text: string): void {
  deps.stdout?.write(`${text}\n`);
}

export async function runSetupCommand(options: SetupOptions, deps: SetupDeps = {}): Promise<void> {
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const tokens = resolveProviderTokens(deps.env);
  const monoClient = deps.monoClient ?? new MonobankClient(tokens.monoToken);
  const budgetProvider = deps.budgetProvider ?? new LunchMoneyV1Client(tokens.lunchMoneyToken);
  const promptResource = deps.prompt ? undefined : createPromptResource();
  const prompt = deps.prompt ?? promptResource!.prompt;

  try {
    const clientInfo = await monoClient.getClientInfo();
    const sources = flattenMonobankSources(clientInfo as MonoClientInfo);
    if (sources.length === 0) {
      throw new Error("No Monobank accounts/cards were found.");
    }

    const assets = await budgetProvider.listAccounts();
    writeLine(deps, "Found Monobank accounts:");
    sources.forEach((source, index) => writeLine(deps, `[${index + 1}] ${formatSource(source)}`));

    const defaultTag = (await askWithDefault(prompt, "Default transaction tag", DEFAULT_TAG)).trim();
    const baselineDate = await askOptionalDate(
      prompt,
      "Baseline date YYYY-MM-DD; leave blank to fetch up to the configured lookback"
    );
    const notifications = (await askYesNo(prompt, "Enable Windows notifications?"))
      ? enableNotifications({
          success: await askYesNo(prompt, "Notify on successful sync/backfill?")
        })
      : disableNotifications();
    const accounts: AccountMapping[] = [];

    for (const source of sources) {
      if (!(await askYesNo(prompt, `Track ${formatSource(source)}?`))) {
        continue;
      }
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

    const config: AppConfig = {
      schemaVersion: 1,
      lunchMoneyApiVersion: "v1",
      lookbackDays: 31,
      baselineDate,
      defaultTag,
      notifications,
      accounts
    };

    await writeConfig(paths.configPath, config);
    writeLine(deps, `Config saved: ${paths.configPath}`);
    writeLine(deps, `Notifications enabled: ${notifications.enabled ? "yes" : "no"}`);
    writeLine(deps, "Tracked mappings:");
    for (const account of accounts) {
      writeLine(
        deps,
        `- ${sanitizeText(account.monoDisplayName)} -> ${sanitizeText(
          account.lunchMoneyAccountName
        )} (${sanitizeText(maskLongIdentifier(account.externalIdPrefix))})`
      );
    }
  } finally {
    promptResource?.close();
  }
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

async function askYesNo(prompt: PromptFunction, question: string): Promise<boolean> {
  while (true) {
    const answer = (await prompt(`${question} yes/no`)).trim().toLowerCase();
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no", ""].includes(answer)) return false;
  }
}

async function askOptionalDate(prompt: PromptFunction, question: string): Promise<string | undefined> {
  while (true) {
    const answer = (await prompt(question)).trim();
    if (!answer) {
      return undefined;
    }
    try {
      parseLocalDate(answer);
      return answer;
    } catch {
      // Keep setup interactive until the user provides a usable config value.
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
  writeLine(deps, "Choose Lunch Money account:");
  assets.forEach((asset, index) => {
    writeLine(deps, `[${index + 1}] ${sanitizeText(asset.name)} ${asset.currency.toUpperCase()}`);
  });
  writeLine(deps, `[${assets.length + 1}] Create new account`);

  const choice = Number((await prompt("Account choice")).trim());
  if (Number.isInteger(choice) && choice >= 1 && choice <= assets.length) {
    return assets[choice - 1];
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

export function createSetupCommand(): Command {
  return new Command("setup")
    .description("Interactive setup for Monobank and Lunch Money mappings")
    .option("--config <path>", "explicit config path")
    .option("--reconfigure", "update existing mappings")
    .action((options: SetupOptions) => runSetupCommand(options));
}
