import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

function memoryLog() {
  return {
    writer: {
      success: async () => undefined,
      error: async () => undefined
    }
  };
}

describe("sync console output", () => {
  it("prints sanitized progress for normal sync runs", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-sync-console-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");
    let stdout = "";
    let stderr = "";

    await runSyncCommand(
      { config: configPath },
      {
        env: { APPDATA: root },
        statementClient: fakeStatementClient([[monoStatementItem()]]),
        budgetProvider: fakeBudgetProvider(),
        logWriter: memoryLog().writer,
        notificationAdapter: { notify: async () => ({ status: "delivered" }) },
        now: new Date("2026-05-16T00:00:00"),
        stdout: { write: (chunk: string) => void (stdout += chunk) },
        stderr: { write: (chunk: string) => void (stderr += chunk) }
      }
    );

    expect(stdout).toContain("Sync started");
    expect(stdout).toContain("Account Monobank Black UAH: fetched 1 transactions");
    expect(stdout).toContain("Sync finished successfully");
    expect(stderr).toBe("");
  });

  it("keeps scheduled quiet sync silent", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-sync-console-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");
    let stdout = "";
    let stderr = "";

    await runSyncCommand(
      { config: configPath, quiet: true },
      {
        env: { APPDATA: root },
        statementClient: fakeStatementClient([[monoStatementItem()]]),
        budgetProvider: fakeBudgetProvider(),
        logWriter: memoryLog().writer,
        notificationAdapter: { notify: async () => ({ status: "delivered" }) },
        now: new Date("2026-05-16T00:00:00"),
        stdout: { write: (chunk: string) => void (stdout += chunk) },
        stderr: { write: (chunk: string) => void (stderr += chunk) }
      }
    );

    expect(stdout).toBe("");
    expect(stderr).toBe("");
  });
});
