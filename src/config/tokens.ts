import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import {
  environmentStatus,
  type CredentialStore
} from "../credentials/credential-store.js";
import { ProtectedCredentialStore } from "../credentials/protected-credential-store.js";
import {
  PROVIDERS,
  PROVIDER_DISPLAY_NAMES,
  PROVIDER_ENV_KEYS,
  type CredentialSource,
  type CredentialStatusSummary,
  type ProviderName,
  type ProviderTokenSet,
  type ProviderTokenSources
} from "../credentials/credential-types.js";
import { resolveRuntimePaths } from "./paths.js";

export type ProviderTokens = ProviderTokenSet;

export const MONOBANK_TOKEN_URL = "https://api.monobank.ua/";
export const LUNCH_MONEY_TOKEN_URL = "https://my.lunchmoney.app/developers";
export const LUNCH_MONEY_API_DOCS_URL = "https://lunchmoney.dev/";

export type ProviderTokenEnvironment = Partial<{
  MONO_TOKEN: string;
  LUNCHMONEY_TOKEN: string;
}>;

export type ProviderTokenResolution = {
  tokens: ProviderTokens;
  sources: ProviderTokenSources;
};

export function createDefaultCredentialStore(
  env: NodeJS.ProcessEnv = process.env
): CredentialStore {
  const paths = resolveRuntimePaths({ env });
  return new ProtectedCredentialStore({ appDataDirectory: paths.appDataDirectory });
}

export async function resolveProviderTokens(
  env: NodeJS.ProcessEnv = process.env,
  credentialStore: CredentialStore = createDefaultCredentialStore(env)
): Promise<ProviderTokens> {
  return (await resolveProviderTokensWithSources(env, credentialStore)).tokens;
}

export async function resolveProviderTokensWithSources(
  env: NodeJS.ProcessEnv = process.env,
  credentialStore: CredentialStore = createDefaultCredentialStore(env)
): Promise<ProviderTokenResolution> {
  const resolved: Partial<Record<ProviderName, string>> = {};
  const sources: Partial<ProviderTokenSources> = {};
  const missing: string[] = [];

  for (const provider of PROVIDERS) {
    const read = await credentialStore.readCredential(provider);
    if (read.success) {
      resolved[provider] = read.secret.trim();
      sources[provider] = "protected-storage";
      continue;
    }

    if (read.source === "inaccessible") {
      throw new CliError(
        `${read.message}. Run mono-lunchmoney credentials set --provider ${provider} or run setup again.`,
        EXIT_CODES.USER_ERROR
      );
    }

    const envToken = env[PROVIDER_ENV_KEYS[provider]]?.trim();
    if (envToken) {
      resolved[provider] = envToken;
      sources[provider] = "environment";
      continue;
    }

    missing.push(PROVIDER_ENV_KEYS[provider]);
    sources[provider] = "missing";
  }

  if (missing.length > 0) {
    throw new CliError(
      `Missing required credential${missing.length === 1 ? "" : "s"}: ${missing.join(
        ", "
      )}. Run mono-lunchmoney setup or mono-lunchmoney credentials set.`,
      EXIT_CODES.USER_ERROR
    );
  }

  return {
    tokens: {
      monoToken: resolved.monobank!,
      lunchMoneyToken: resolved.lunchmoney!
    },
    sources: {
      monobank: sources.monobank ?? "missing",
      lunchmoney: sources.lunchmoney ?? "missing"
    }
  };
}

export async function saveProviderTokensToProtectedStorage(
  tokens: ProviderTokenEnvironment,
  credentialStore: CredentialStore
): Promise<void> {
  const monoToken = tokens.MONO_TOKEN?.trim();
  const lunchMoneyToken = tokens.LUNCHMONEY_TOKEN?.trim();

  if (monoToken) {
    await credentialStore.saveCredential("monobank", monoToken);
  }
  if (lunchMoneyToken) {
    await credentialStore.saveCredential("lunchmoney", lunchMoneyToken);
  }
}

export async function credentialStatusesWithEnvironment(
  env: NodeJS.ProcessEnv = process.env,
  credentialStore: CredentialStore = createDefaultCredentialStore(env)
): Promise<CredentialStatusSummary[]> {
  const statuses: CredentialStatusSummary[] = [];

  for (const provider of PROVIDERS) {
    const protectedStatus = await credentialStore.getStatus(provider);
    if (protectedStatus.source === "protected-storage" || protectedStatus.source === "inaccessible") {
      statuses.push(protectedStatus);
      continue;
    }

    if (env[PROVIDER_ENV_KEYS[provider]]?.trim()) {
      statuses.push(environmentStatus(provider));
      continue;
    }

    statuses.push(protectedStatus);
  }

  return statuses;
}

export function sourceLabel(source: CredentialSource): string {
  switch (source) {
    case "protected-storage":
      return "protected storage";
    case "environment":
      return "environment";
    case "entered-now":
      return "entered now";
    case "inaccessible":
      return "inaccessible";
    case "missing":
      return "missing";
  }
}

export function providerLabel(provider: ProviderName): string {
  return PROVIDER_DISPLAY_NAMES[provider];
}
