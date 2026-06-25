import type {
  AppConfig,
  AccountMapping,
  IgnoredMonobankAccount
} from "../../src/config/config.model.js";

export function accountMapping(overrides: Partial<AccountMapping> = {}): AccountMapping {
  return {
    enabled: true,
    monoAccountId: "mono-account-1",
    monoDisplayName: "Mono Black UAH ****1111",
    monoType: "black",
    monoCurrencyCode: 980,
    currency: "uah",
    lunchMoneyAssetId: 111,
    lunchMoneyAccountName: "Monobank Black UAH",
    tag: "monobank-sync",
    externalIdPrefix: "mono:mono-account-1",
    ...overrides
  };
}

export function ignoredMonobankAccount(
  overrides: Partial<IgnoredMonobankAccount> = {}
): IgnoredMonobankAccount {
  return {
    enabled: true,
    monoAccountId: "mono-ignored-account",
    monoDisplayName: "Mono White UAH ****2222",
    monoType: "white",
    monoCurrencyCode: 980,
    currency: "uah",
    maskedPan: "4444******2222",
    ...overrides
  };
}

export function appConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    schemaVersion: 1,
    lunchMoneyApiVersion: "v1",
    lookbackDays: 31,
    skipBalanceUpdate: false,
    defaultTag: "monobank-sync",
    ignoredMonobankAccounts: [],
    notifications: {
      enabled: false,
      notifyOnStart: true,
      notifyOnSuccess: false,
      notifyOnFailure: true,
      notifyOnPartialFailure: true,
      notifyOnLockHeld: true
    },
    accounts: [accountMapping()],
    ...overrides
  };
}
