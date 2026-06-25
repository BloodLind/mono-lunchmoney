import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { formatConfigShow, loadConfig, sanitizedConfigSummary } from "../../../src/config/config.loader.js";
import {
  getEnabledIgnoredMonobankAccounts,
  getSyncableAccountMappings,
  parseAppConfig
} from "../../../src/config/config.model.js";
import { resolveRuntimePaths } from "../../../src/config/paths.js";
import { accountMapping, appConfig, ignoredMonobankAccount } from "../../fixtures/config.js";

function validConfig() {
  return {
    schemaVersion: 1,
    lunchMoneyApiVersion: "v1",
    lookbackDays: 31,
    defaultTag: "monobank-sync",
    scheduler: {
      enabled: true,
      type: "windows-task-scheduler",
      dailyAt: "20:00",
      taskName: "MonoLunchMoneySync"
    },
    accounts: [
      {
        enabled: true,
        monoAccountId: "secret-account-id",
        monoDisplayName: "Mono Black 4444333322221111",
        monoCurrencyCode: 980,
        currency: "uah",
        lunchMoneyAssetId: 123,
        lunchMoneyAccountName: "Monobank Black",
        tag: "monobank-sync",
        externalIdPrefix: "mono:abc123"
      }
    ],
    MONO_TOKEN: "must-not-display"
  };
}

describe("config loader", () => {
  it("loads a valid config and returns sanitized display data", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mono-config-"));
    const configPath = path.join(dir, "config.json");
    writeFileSync(configPath, JSON.stringify(validConfig()), "utf8");

    const loaded = loadConfig(configPath);
    expect(loaded.exists).toBe(true);
    if (!loaded.exists) throw new Error("expected config to exist");

    const summary = JSON.stringify(sanitizedConfigSummary(loaded.config));
    expect(summary).not.toContain("must-not-display");
    expect(summary).not.toContain("4444333322221111");
    expect(summary).not.toContain("secret-account-id");
    expect(summary).toContain("4444...1111");
  });

  it("formats missing config without creating transaction state", () => {
    const paths = resolveRuntimePaths({
      configPath: "C:\\missing\\config.json",
      env: { APPDATA: "C:\\Users\\Ada\\AppData\\Roaming" }
    });
    const output = stripAnsi(formatConfigShow(paths, { exists: false, configPath: paths.configPath }));

    expect(output).toMatch(/Config exists:\s+no/);
    expect(output).toContain("Run mono-lunchmoney setup");
    expect(output).not.toContain("MONO_TOKEN");
  });

  it("defaults ignored transfer sources to an empty list", () => {
    const parsed = parseAppConfig({
      schemaVersion: 1,
      lunchMoneyApiVersion: "v1",
      lookbackDays: 31,
      defaultTag: "monobank-sync",
      accounts: []
    });

    expect(parsed.ignoredMonobankAccounts).toEqual([]);
  });

  it("updates Lunch Money balances by default for new imports", () => {
    const parsed = parseAppConfig({
      schemaVersion: 1,
      lunchMoneyApiVersion: "v1",
      lookbackDays: 31,
      defaultTag: "monobank-sync",
      accounts: []
    });

    expect(parsed.skipBalanceUpdate).toBe(false);
  });

  it("rejects malformed ignored transfer source IBAN hashes", () => {
    expect(() =>
      parseAppConfig(
        appConfig({
          ignoredMonobankAccounts: [ignoredMonobankAccount({ ibanSha256: "not-a-sha256" })]
        })
      )
    ).toThrow();
  });

  it("derives enabled ignored sources and syncable mappings", () => {
    const config = appConfig({
      ignoredMonobankAccounts: [
        ignoredMonobankAccount({ monoAccountId: "ignored-enabled" }),
        ignoredMonobankAccount({ enabled: false, monoAccountId: "ignored-disabled" })
      ],
      accounts: [
        accountMapping({ monoAccountId: "ignored-enabled" }),
        accountMapping({ monoAccountId: "ignored-disabled", lunchMoneyAssetId: 222 }),
        accountMapping({ monoAccountId: "normal", lunchMoneyAssetId: 333 })
      ]
    });

    expect(getEnabledIgnoredMonobankAccounts(config).map((account) => account.monoAccountId)).toEqual([
      "ignored-enabled"
    ]);
    expect(getSyncableAccountMappings(config).map((account) => account.monoAccountId)).toEqual([
      "ignored-disabled",
      "normal"
    ]);
  });
});
