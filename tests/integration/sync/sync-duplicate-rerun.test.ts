import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSync } from "../../../src/sync/sync-runner.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

describe("sync duplicate rerun", () => {
  it("submits the same deterministic external id on repeated runs", async () => {
    const provider = fakeBudgetProvider();
    const base = {
      mode: "sync" as const,
      config: appConfig(),
      configPath: "config.json",
      budgetProvider: provider,
      logWriter: { success: async () => undefined, error: async () => undefined },
      now: new Date("2026-05-16T00:00:00")
    };

    await runSync({
      ...base,
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-dup-")), "sync.lock"),
      statementClient: fakeStatementClient([[monoStatementItem()]])
    });
    await runSync({
      ...base,
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-dup-")), "sync.lock"),
      statementClient: fakeStatementClient([[monoStatementItem()]])
    });

    expect(provider.imports[0].transactions[0].external_id).toBe(provider.imports[1].transactions[0].external_id);
  });
});
