import { Command } from "commander";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { CliError, EXIT_CODES } from "../cli/command-registry.js";
import { createCommandUi } from "../cli/ui.js";
import {
  credentialStatusesWithEnvironment,
  createDefaultCredentialStore,
  providerLabel,
  sourceLabel
} from "../config/tokens.js";
import type { CredentialStore } from "../credentials/credential-store.js";
import {
  isProviderName,
  PROVIDERS,
  type ProviderName
} from "../credentials/credential-types.js";
import { LunchMoneyV1Client } from "../lunchmoney/lunchmoney-v1-client.js";
import { MonobankClient } from "../monobank/mono-client.js";
import { sanitizeText } from "../utils/masking.js";

export type CredentialsProviderOption = ProviderName | "all";

export type CredentialsStatusOptions = {
  provider?: CredentialsProviderOption;
};

export type CredentialsSetOptions = {
  provider?: CredentialsProviderOption;
  force?: boolean;
};

export type CredentialsRemoveOptions = {
  provider?: CredentialsProviderOption;
  yes?: boolean;
};

export type CredentialsDeps = {
  env?: NodeJS.ProcessEnv;
  stdout?: Pick<NodeJS.WriteStream, "write">;
  prompt?: (question: string) => Promise<string>;
  credentialStore?: CredentialStore;
  validateMonobankToken?: (token: string) => Promise<void>;
  validateLunchMoneyToken?: (token: string) => Promise<void>;
};

export async function runCredentialsStatus(
  options: CredentialsStatusOptions,
  deps: CredentialsDeps = {}
): Promise<void> {
  const env = deps.env ?? process.env;
  const ui = createCommandUi(env);
  const store = deps.credentialStore ?? createDefaultCredentialStore(env);
  const providers = providersFromOption(options.provider ?? "all");
  const statuses = (await credentialStatusesWithEnvironment(env, store)).filter((status) =>
    providers.includes(status.provider)
  );

  const lines = [
    ui.title("Credential Status"),
    "",
    ...ui.keyValues(
      statuses.map((status) => ({
        label: providerLabel(status.provider),
        value: `${status.health} (${sourceLabel(status.source)})`,
        tone: status.health === "ready" ? "success" : status.health === "inaccessible" ? "danger" : "warning"
      }))
    )
  ];
  deps.stdout?.write(`${lines.join("\n")}\n`);
}

export async function runCredentialsSet(
  options: CredentialsSetOptions,
  deps: CredentialsDeps = {}
): Promise<void> {
  const env = deps.env ?? process.env;
  const ui = createCommandUi(env);
  const store = deps.credentialStore ?? createDefaultCredentialStore(env);
  const providers = providersFromOption(options.provider ?? "all");
  const promptResource = deps.prompt ? undefined : createPromptResource();
  const prompt = deps.prompt ?? promptResource!.prompt;

  try {
    deps.stdout?.write(`${ui.title("Save Provider Credentials")}\n\n`);
    for (const provider of providers) {
      const existing = await store.getStatus(provider);
      if (existing.present && !options.force) {
        const replace = await askYesNo(prompt, `Replace saved ${providerLabel(provider)} credential?`);
        if (!replace) {
          deps.stdout?.write(`${ui.warning(`${providerLabel(provider)} credential unchanged.`)}\n`);
          continue;
        }
      }

      const token = await askRequired(prompt, `Paste ${providerLabel(provider)} API token`);
      await validateProviderToken(provider, token, deps);
      await store.saveCredential(provider, token);
      deps.stdout?.write(`${ui.success(`${providerLabel(provider)} credential saved.`)}\n`);
    }
  } finally {
    promptResource?.close();
  }
}

export async function runCredentialsRemove(
  options: CredentialsRemoveOptions,
  deps: CredentialsDeps = {}
): Promise<void> {
  const env = deps.env ?? process.env;
  const ui = createCommandUi(env);
  const store = deps.credentialStore ?? createDefaultCredentialStore(env);
  const providers = providersFromOption(options.provider ?? "all");
  const promptResource = deps.prompt ? undefined : createPromptResource();
  const prompt = deps.prompt ?? promptResource!.prompt;

  try {
    if (!options.yes) {
      const confirmed = await askYesNo(
        prompt,
        `Remove ${providers.length === PROVIDERS.length ? "all saved credentials" : `${providerLabel(providers[0])} credential`}?`
      );
      if (!confirmed) {
        deps.stdout?.write(`${ui.warning("Credential removal cancelled.")}\n`);
        return;
      }
    }

    for (const provider of providers) {
      await store.removeCredential(provider);
      deps.stdout?.write(`${ui.success(`${providerLabel(provider)} credential removed.`)}\n`);
    }
  } finally {
    promptResource?.close();
  }
}

function providersFromOption(provider: CredentialsProviderOption): ProviderName[] {
  if (provider === "all") {
    return [...PROVIDERS];
  }
  if (!isProviderName(provider)) {
    throw new CliError("--provider must be monobank, lunchmoney, or all.", EXIT_CODES.USER_ERROR);
  }
  return [provider];
}

async function validateProviderToken(
  provider: ProviderName,
  token: string,
  deps: CredentialsDeps
): Promise<void> {
  try {
    if (provider === "monobank") {
      if (deps.validateMonobankToken) {
        await deps.validateMonobankToken(token);
      } else {
        await new MonobankClient(token).getClientInfo();
      }
      return;
    }

    if (deps.validateLunchMoneyToken) {
      await deps.validateLunchMoneyToken(token);
    } else {
      await new LunchMoneyV1Client(token).listAccounts();
    }
  } catch (error) {
    throw new CliError(
      `${providerLabel(provider)} token validation failed: ${sanitizeText(
        error instanceof Error ? error.message : error
      )}`,
      EXIT_CODES.EXTERNAL_ERROR
    );
  }
}

function createPromptResource(): { prompt: (question: string) => Promise<string>; close: () => void } {
  const rl = createInterface({ input, output });
  return {
    prompt: async (question: string) => rl.question(`${question}\n> `),
    close: () => rl.close()
  };
}

async function askRequired(
  prompt: (question: string) => Promise<string>,
  question: string
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const answer = (await prompt(question)).trim();
    if (answer) {
      return answer;
    }
  }
  throw new CliError(`${question} is required.`, EXIT_CODES.USER_ERROR);
}

async function askYesNo(
  prompt: (question: string) => Promise<string>,
  question: string
): Promise<boolean> {
  while (true) {
    const answer = (await prompt(`${question} yes/no`)).trim().toLowerCase();
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no", ""].includes(answer)) return false;
  }
}

export function createCredentialsCommand(deps: CredentialsDeps = {}): Command {
  const command = new Command("credentials").description("Manage protected provider tokens");

  command
    .command("status")
    .description("Show whether provider credentials are available without revealing values")
    .option("--provider <provider>", "monobank, lunchmoney, or all", "all")
    .action((options: CredentialsStatusOptions) => runCredentialsStatus(options, deps));

  command
    .command("set")
    .description("Prompt for provider tokens, validate them, and save to protected storage")
    .option("--provider <provider>", "monobank, lunchmoney, or all", "all")
    .option("--force", "replace existing credentials without asking first")
    .action((options: CredentialsSetOptions) => runCredentialsSet(options, deps));

  command
    .command("remove")
    .description("Remove saved protected credentials")
    .option("--provider <provider>", "monobank, lunchmoney, or all", "all")
    .option("--yes", "remove without confirmation")
    .action((options: CredentialsRemoveOptions) => runCredentialsRemove(options, deps));

  return command;
}
