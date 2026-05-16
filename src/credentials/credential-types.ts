export const PROVIDERS = ["monobank", "lunchmoney"] as const;

export type ProviderName = (typeof PROVIDERS)[number];

export type CredentialSource =
  | "protected-storage"
  | "environment"
  | "entered-now"
  | "missing"
  | "inaccessible";

export type CredentialHealth =
  | "ready"
  | "needs-setup"
  | "invalid"
  | "inaccessible"
  | "unknown";

export type CredentialOperation =
  | "save"
  | "replace"
  | "remove"
  | "read"
  | "status"
  | "validate";

export type ProviderCredential = {
  provider: ProviderName;
  displayName: string;
  secret: string;
  savedAt?: string;
  lastValidatedAt?: string;
  status: CredentialHealth;
};

export type CredentialStatusSummary = {
  provider: ProviderName;
  present: boolean;
  source: CredentialSource;
  health: CredentialHealth;
  message: string;
  savedAt?: string;
  lastValidatedAt?: string;
};

export type CredentialOperationResult = {
  operation: CredentialOperation;
  provider?: ProviderName;
  success: boolean;
  message: string;
  recoverable: boolean;
};

export type ProviderTokenSet = {
  monoToken: string;
  lunchMoneyToken: string;
};

export type ProviderTokenSources = Record<ProviderName, CredentialSource>;

export type CredentialReadResult =
  | {
      success: true;
      provider: ProviderName;
      secret: string;
      savedAt?: string;
      lastValidatedAt?: string;
    }
  | {
      success: false;
      provider: ProviderName;
      status: Exclude<CredentialHealth, "ready">;
      source: Exclude<CredentialSource, "protected-storage" | "environment" | "entered-now">;
      message: string;
      recoverable: boolean;
    };

export type ProtectedCredentialRecord = {
  schemaVersion: 1;
  provider: ProviderName;
  encryptedSecret: string;
  savedAt: string;
  lastValidatedAt?: string;
  protection: "windows-dpapi-current-user";
};

export const PROVIDER_DISPLAY_NAMES: Record<ProviderName, string> = {
  monobank: "Monobank",
  lunchmoney: "Lunch Money"
};

export const PROVIDER_ENV_KEYS: Record<ProviderName, "MONO_TOKEN" | "LUNCHMONEY_TOKEN"> = {
  monobank: "MONO_TOKEN",
  lunchmoney: "LUNCHMONEY_TOKEN"
};

export function providerDisplayName(provider: ProviderName): string {
  return PROVIDER_DISPLAY_NAMES[provider];
}

export function isProviderName(value: string): value is ProviderName {
  return (PROVIDERS as readonly string[]).includes(value);
}
