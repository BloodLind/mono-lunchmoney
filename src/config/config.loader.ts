import { existsSync, readFileSync } from "node:fs";
import { createCommandUi } from "../cli/ui.js";
import {
  getEnabledIgnoredMonobankAccounts,
  getSyncableAccountMappings,
  parseAppConfig,
  type AppConfig
} from "./config.model.js";
import type { RuntimePaths } from "./paths.js";
import { maskLongIdentifier, sanitizeObject } from "../utils/masking.js";

export type LoadedConfig =
  | {
      exists: false;
      configPath: string;
      config?: undefined;
    }
  | {
      exists: true;
      configPath: string;
      config: AppConfig;
    };

export function loadConfig(configPath: string): LoadedConfig {
  if (!existsSync(configPath)) {
    return { exists: false, configPath };
  }

  const parsed = JSON.parse(readFileSync(configPath, "utf8")) as unknown;
  return {
    exists: true,
    configPath,
    config: parseAppConfig(parsed)
  };
}

export function sanitizedConfigSummary(config: AppConfig): unknown {
  const enabledIgnored = getEnabledIgnoredMonobankAccounts(config);
  const syncableAccounts = getSyncableAccountMappings(config);
  const syncableIds = new Set(syncableAccounts.map((account) => account.monoAccountId));
  return sanitizeObject({
    schemaVersion: config.schemaVersion,
    lunchMoneyApiVersion: config.lunchMoneyApiVersion,
    lookbackDays: config.lookbackDays,
    skipBalanceUpdate: config.skipBalanceUpdate,
    baselineDate: config.baselineDate,
    defaultTag: config.defaultTag,
    scheduler: config.scheduler,
    notifications: config.notifications,
    ignoredTransferSummary: {
      ignoredSourceCount: enabledIgnored.length,
      syncableMappingCount: syncableAccounts.length,
      skippedMappingCount: config.accounts.filter(
        (account) => account.enabled && !syncableIds.has(account.monoAccountId)
      ).length
    },
    ignoredMonobankAccounts: config.ignoredMonobankAccounts.map((account) => ({
      enabled: account.enabled,
      monoDisplayName: account.monoDisplayName,
      monoType: account.monoType,
      monoCurrencyCode: account.monoCurrencyCode,
      currency: account.currency,
      monoAccountId: maskLongIdentifier(account.monoAccountId),
      maskedPan: account.maskedPan,
      hasIbanMatcher: Boolean(account.ibanSha256)
    })),
    accounts: config.accounts.map((account) => ({
      enabled: account.enabled,
      monoDisplayName: account.monoDisplayName,
      monoType: account.monoType,
      monoCurrencyCode: account.monoCurrencyCode,
      currency: account.currency,
      lunchMoneyAssetId: account.lunchMoneyAssetId,
      lunchMoneyAccountName: account.lunchMoneyAccountName,
      tag: account.tag,
      externalIdPrefix: maskLongIdentifier(account.externalIdPrefix)
    }))
  });
}

export function formatConfigShow(
  paths: RuntimePaths,
  loaded: LoadedConfig,
  env: NodeJS.ProcessEnv = process.env
): string {
  const ui = createCommandUi(env);
  const lines = [
    ui.title("Mono Lunch Money Configuration"),
    "",
    ui.section("Runtime Files"),
    ...ui.keyValues([
      { label: "Config exists", value: loaded.exists ? "yes" : "no", tone: loaded.exists ? "success" : "warning" },
      { label: "Config path", value: paths.configPath },
      { label: "Sync log path", value: paths.syncLogPath },
      { label: "Error log path", value: paths.errorLogPath },
      { label: "Lock path", value: paths.lockPath },
      { label: "Credential directory", value: paths.credentialDirectory },
      {
        label: "Monobank credential",
        value: existsSync(paths.credentialRecordPaths.monobank) ? "saved" : "not saved",
        tone: existsSync(paths.credentialRecordPaths.monobank) ? "success" : "muted"
      },
      {
        label: "Lunch Money credential",
        value: existsSync(paths.credentialRecordPaths.lunchmoney) ? "saved" : "not saved",
        tone: existsSync(paths.credentialRecordPaths.lunchmoney) ? "success" : "muted"
      }
    ])
  ];

  if (!loaded.exists) {
    lines.push("");
    lines.push(ui.section("Next Step"));
    lines.push(ui.bullet(`Run ${ui.command("mono-lunchmoney setup")} to create config.`));
    return `${lines.join("\n")}\n`;
  }

  lines.push("");
  lines.push(ui.section("Sanitized Config"));
  lines.push(JSON.stringify(sanitizedConfigSummary(loaded.config), null, 2));
  return `${lines.join("\n")}\n`;
}
