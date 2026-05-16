import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSync } from "../../../src/sync/sync-runner.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

function memoryLog() {
  const success: string[] = [];
  const error: string[] = [];
  return { success, error, writer: { success: async (line: string) => void success.push(line), error: async (line: string) => void error.push(line) } };
}

describe("sync runner success", () => {
  it("imports one configured account", async () => {
    const logs = memoryLog();
    const provider = fakeBudgetProvider();
    const result = await runSync({
      mode: "sync",
      config: appConfig(),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-success-")), "sync.lock"),
      statementClient: fakeStatementClient([[monoStatementItem()]]),
      budgetProvider: provider,
      logWriter: logs.writer,
      now: new Date("2026-05-16T00:00:00")
    });

    expect(result.hadFailure).toBe(false);
    expect(provider.imports).toHaveLength(1);
    expect(provider.imports[0].transactions[0]).toMatchObject({ status: "uncleared", tags: ["monobank-sync"] });
    expect(logs.success.join("")).toContain("Sync finished successfully");
  });
});
