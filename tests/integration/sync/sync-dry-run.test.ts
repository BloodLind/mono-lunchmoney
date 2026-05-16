import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSync } from "../../../src/sync/sync-runner.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

describe("sync dry run", () => {
  it("maps transactions without calling Lunch Money import", async () => {
    const provider = fakeBudgetProvider();
    const result = await runSync({
      mode: "sync",
      config: appConfig(),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-dry-")), "sync.lock"),
      statementClient: fakeStatementClient([[monoStatementItem()]]),
      budgetProvider: provider,
      logWriter: { success: async () => undefined, error: async () => undefined },
      dryRun: true,
      now: new Date("2026-05-16T00:00:00")
    });

    expect(result.accounts[0].submittedCount).toBe(1);
    expect(provider.imports).toHaveLength(0);
  });
});
