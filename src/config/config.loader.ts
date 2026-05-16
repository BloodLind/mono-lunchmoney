import { existsSync, readFileSync } from "node:fs";
import { parseAppConfig, type AppConfig } from "./config.model.js";
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
  return sanitizeObject({
    schemaVersion: config.schemaVersion,
    lunchMoneyApiVersion: config.lunchMoneyApiVersion,
    lookbackDays: config.lookbackDays,
    baselineDate: config.baselineDate,
    defaultTag: config.defaultTag,
    scheduler: config.scheduler,
    notifications: config.notifications,
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

export function formatConfigShow(paths: RuntimePaths, loaded: LoadedConfig): string {
  const lines = [
    "Mono Lunch Money configuration",
    `Config exists: ${loaded.exists ? "yes" : "no"}`,
    `Config path: ${paths.configPath}`,
    `Sync log path: ${paths.syncLogPath}`,
    `Error log path: ${paths.errorLogPath}`,
    `Lock path: ${paths.lockPath}`
  ];

  if (!loaded.exists) {
    lines.push("Next step: run mono-lunchmoney setup to create config.");
    return `${lines.join("\n")}\n`;
  }

  lines.push("Sanitized config:");
  lines.push(JSON.stringify(sanitizedConfigSummary(loaded.config), null, 2));
  return `${lines.join("\n")}\n`;
}
