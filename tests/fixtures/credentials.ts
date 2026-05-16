import type { CredentialStore } from "../../src/credentials/credential-store.js";
import {
  PROVIDERS,
  PROVIDER_DISPLAY_NAMES,
  type CredentialOperationResult,
  type CredentialReadResult,
  type CredentialStatusSummary,
  type ProviderName
} from "../../src/credentials/credential-types.js";

export const SAMPLE_MONO_TOKEN = "mono-secure-token-1234567890";
export const SAMPLE_LUNCHMONEY_TOKEN = "lunch-secure-token-0987654321";

export type MemoryCredentialStore = CredentialStore & {
  saved: Partial<Record<ProviderName, string>>;
  inaccessibleProviders: Set<ProviderName>;
};

export function memoryCredentialStore(
  initial: Partial<Record<ProviderName, string>> = {}
): MemoryCredentialStore {
  const saved: Partial<Record<ProviderName, string>> = { ...initial };
  const inaccessibleProviders = new Set<ProviderName>();

  return {
    saved,
    inaccessibleProviders,
    async saveCredential(provider: ProviderName, secret: string): Promise<CredentialOperationResult> {
      saved[provider] = secret;
      return {
        operation: "save",
        provider,
        success: true,
        message: `${PROVIDER_DISPLAY_NAMES[provider]} saved.`,
        recoverable: true
      };
    },
    async readCredential(provider: ProviderName): Promise<CredentialReadResult> {
      if (inaccessibleProviders.has(provider)) {
        return {
          success: false,
          provider,
          status: "inaccessible",
          source: "inaccessible",
          message: `${PROVIDER_DISPLAY_NAMES[provider]} inaccessible.`,
          recoverable: true
        };
      }
      const secret = saved[provider];
      if (!secret) {
        return {
          success: false,
          provider,
          status: "needs-setup",
          source: "missing",
          message: `${PROVIDER_DISPLAY_NAMES[provider]} missing.`,
          recoverable: true
        };
      }
      return { success: true, provider, secret };
    },
    async removeCredential(provider: ProviderName): Promise<CredentialOperationResult> {
      delete saved[provider];
      return {
        operation: "remove",
        provider,
        success: true,
        message: `${PROVIDER_DISPLAY_NAMES[provider]} removed.`,
        recoverable: true
      };
    },
    async getStatus(provider: ProviderName): Promise<CredentialStatusSummary> {
      if (inaccessibleProviders.has(provider)) {
        return {
          provider,
          present: false,
          source: "inaccessible",
          health: "inaccessible",
          message: `${PROVIDER_DISPLAY_NAMES[provider]} inaccessible.`
        };
      }
      if (saved[provider]) {
        return {
          provider,
          present: true,
          source: "protected-storage",
          health: "ready",
          message: `${PROVIDER_DISPLAY_NAMES[provider]} saved.`
        };
      }
      return {
        provider,
        present: false,
        source: "missing",
        health: "needs-setup",
        message: `${PROVIDER_DISPLAY_NAMES[provider]} missing.`
      };
    }
  };
}

export function allSampleTokens(): Record<ProviderName, string> {
  return {
    monobank: SAMPLE_MONO_TOKEN,
    lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
  };
}

export function allProviderNames(): ProviderName[] {
  return [...PROVIDERS];
}
