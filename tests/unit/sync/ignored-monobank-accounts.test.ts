import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSync } from "../../../src/sync/sync-runner.js";
import { accountMapping, appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

describe("ignored Monobank accounts during sync", () => {
  it("does not fetch or import mapped accounts listed in ignoredMonobankAccounts", async () => {
    const statementClient = fakeStatementClient([[monoStatementItem({ id: "kept-tx" })]]);
    const budgetProvider = fakeBudgetProvider();
    const successLines: string[] = [];

    const result = await runSync({
      mode: "sync",
      config: appConfig({
        ignoredMonobankAccounts: [
          {
            enabled: true,
            monoAccountId: "ignored-account",
            monoDisplayName: "Ignored Mono",
            monoCurrencyCode: 980,
            currency: "uah"
          }
        ],
        accounts: [
          accountMapping({
            monoAccountId: "ignored-account",
            lunchMoneyAccountName: "Ignored Lunch Money"
          }),
          accountMapping({
            monoAccountId: "kept-account",
            lunchMoneyAccountName: "Kept Lunch Money",
            lunchMoneyAssetId: 222
          })
        ]
      }),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-ignore-")), "sync.lock"),
      statementClient,
      budgetProvider,
      logWriter: {
        success: async (line) => void successLines.push(line),
        error: async () => undefined
      },
      now: new Date("2026-05-16T00:00:00")
    });

    expect(statementClient.calls).toHaveLength(1);
    expect(statementClient.calls[0]).toMatchObject({ accountId: "kept-account" });
    expect(budgetProvider.imports).toHaveLength(1);
    expect(budgetProvider.imports[0].transactions[0]).toMatchObject({ asset_id: 222 });
    expect(result.submittedCount).toBe(1);
    expect(successLines.join("")).toContain("Ignored Lunch Money: skipped");
  });
});
