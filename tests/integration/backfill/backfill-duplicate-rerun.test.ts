import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { splitBackfillWindows } from "../../../src/sync/backfill-windows.js";
import { runSync } from "../../../src/sync/sync-runner.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

describe("backfill duplicate rerun", () => {
  it("reuses the same external id for the same historical transaction", async () => {
    const provider = fakeBudgetProvider();
    const windows = splitBackfillWindows("2026-05-01", "2026-05-15");
    const base = {
      mode: "backfill" as const,
      config: appConfig(),
      configPath: "config.json",
      budgetProvider: provider,
      logWriter: { success: async () => undefined, error: async () => undefined },
      windows
    };

    await runSync({
      ...base,
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-backfill-")), "sync.lock"),
      statementClient: fakeStatementClient([[monoStatementItem({ id: "historical" })]])
    });
    await runSync({
      ...base,
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-backfill-")), "sync.lock"),
      statementClient: fakeStatementClient([[monoStatementItem({ id: "historical" })]])
    });

    expect(provider.imports[0].transactions[0].external_id).toBe(provider.imports[1].transactions[0].external_id);
  });
});
