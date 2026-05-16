import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSync } from "../../../src/sync/sync-runner.js";
import { accountMapping, appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, monoStatementItem } from "../../fixtures/providers.js";

describe("sync partial account failure", () => {
  it("continues after an isolated account failure and reports non-success", async () => {
    let call = 0;
    const result = await runSync({
      mode: "sync",
      config: appConfig({
        accounts: [
          accountMapping({ monoAccountId: "bad", lunchMoneyAccountName: "Bad" }),
          accountMapping({ monoAccountId: "good", lunchMoneyAssetId: 222, lunchMoneyAccountName: "Good" })
        ]
      }),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-partial-")), "sync.lock"),
      statementClient: {
        async getStatement() {
          call += 1;
          if (call === 1) throw new Error("provider failed");
          return [monoStatementItem({ id: "good-tx" })];
        }
      },
      budgetProvider: fakeBudgetProvider(),
      logWriter: { success: async () => undefined, error: async () => undefined },
      now: new Date("2026-05-16T00:00:00")
    });

    expect(result.hadFailure).toBe(true);
    expect(result.accounts).toHaveLength(2);
    expect(result.accounts[1].submittedCount).toBe(1);
  });
});
