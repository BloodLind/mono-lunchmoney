import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatConfigShow, loadConfig, sanitizedConfigSummary } from "../../../src/config/config.loader.js";
import { resolveRuntimePaths } from "../../../src/config/paths.js";

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
    const output = formatConfigShow(paths, { exists: false, configPath: paths.configPath });

    expect(output).toContain("Config exists: no");
    expect(output).toContain("run mono-lunchmoney setup");
    expect(output).not.toContain("MONO_TOKEN");
  });
});
