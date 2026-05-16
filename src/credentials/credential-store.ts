import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { sanitizeText } from "../utils/masking.js";
import {
  PROVIDERS,
  PROVIDER_DISPLAY_NAMES,
  type CredentialOperationResult,
  type CredentialReadResult,
  type CredentialStatusSummary,
  type ProviderName
} from "./credential-types.js";

export type CredentialStore = {
  saveCredential(provider: ProviderName, secret: string): Promise<CredentialOperationResult>;
  readCredential(provider: ProviderName): Promise<CredentialReadResult>;
  removeCredential(provider: ProviderName): Promise<CredentialOperationResult>;
  getStatus(provider: ProviderName): Promise<CredentialStatusSummary>;
};

export function assertNonEmptySecret(provider: ProviderName, secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new CliError(`${PROVIDER_DISPLAY_NAMES[provider]} token is required.`, EXIT_CODES.USER_ERROR);
  }
  return trimmed;
}

export function savedResult(provider: ProviderName, replaced = false): CredentialOperationResult {
  return {
    operation: replaced ? "replace" : "save",
    provider,
    success: true,
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential saved in protected storage.`,
    recoverable: true
  };
}

export function removedResult(provider: ProviderName): CredentialOperationResult {
  return {
    operation: "remove",
    provider,
    success: true,
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential removed from protected storage.`,
    recoverable: true
  };
}

export function missingReadResult(provider: ProviderName): CredentialReadResult {
  return {
    success: false,
    provider,
    status: "needs-setup",
    source: "missing",
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential is not saved.`,
    recoverable: true
  };
}

export function inaccessibleReadResult(provider: ProviderName, reason: unknown): CredentialReadResult {
  return {
    success: false,
    provider,
    status: "inaccessible",
    source: "inaccessible",
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential is inaccessible: ${sanitizeText(reason)}`,
    recoverable: true
  };
}

export function missingStatus(provider: ProviderName): CredentialStatusSummary {
  return {
    provider,
    present: false,
    source: "missing",
    health: "needs-setup",
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential is not saved.`
  };
}

export function protectedStatus(
  provider: ProviderName,
  metadata: { savedAt?: string; lastValidatedAt?: string } = {}
): CredentialStatusSummary {
  return {
    provider,
    present: true,
    source: "protected-storage",
    health: "ready",
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential is saved.`,
    savedAt: metadata.savedAt,
    lastValidatedAt: metadata.lastValidatedAt
  };
}

export function inaccessibleStatus(provider: ProviderName, reason: unknown): CredentialStatusSummary {
  return {
    provider,
    present: false,
    source: "inaccessible",
    health: "inaccessible",
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential storage is inaccessible: ${sanitizeText(
      reason
    )}`
  };
}

export function environmentStatus(provider: ProviderName): CredentialStatusSummary {
  return {
    provider,
    present: true,
    source: "environment",
    health: "ready",
    message: `${PROVIDER_DISPLAY_NAMES[provider]} credential is available from environment.`
  };
}

export async function allCredentialStatuses(
  store: CredentialStore
): Promise<CredentialStatusSummary[]> {
  return Promise.all(PROVIDERS.map((provider) => store.getStatus(provider)));
}
