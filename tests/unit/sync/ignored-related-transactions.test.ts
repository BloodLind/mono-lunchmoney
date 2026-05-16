import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSync } from "../../../src/sync/sync-runner.js";
import { accountMapping, appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";
import { sha256Hex } from "../../../src/utils/masking.js";

describe("ignored related transactions during sync", () => {
  it("does not import transactions on tracked accounts when counterparty is an ignored account", async () => {
    const ignoredTransfer = monoStatementItem({
      id: "transfer-from-ignored-card",
      description: "Transfer from card *2222",
      counterIban: "UA123456789012345678901234567"
    });
    const normalTransaction = monoStatementItem({ id: "normal-purchase", description: "Coffee" });
    const statementClient = fakeStatementClient([[ignoredTransfer, normalTransaction]]);
    const budgetProvider = fakeBudgetProvider();
    const successLines: string[] = [];

    const result = await runSync({
      mode: "sync",
      config: appConfig({
        ignoredMonobankAccounts: [
          {
            enabled: true,
            monoAccountId: "card-a",
            monoDisplayName: "Card A",
            monoCurrencyCode: 980,
            currency: "uah",
            maskedPan: "4444******2222",
            ibanSha256: sha256Hex("UA123456789012345678901234567")
          }
        ],
        accounts: [
          accountMapping({
            monoAccountId: "card-b",
            lunchMoneyAccountName: "Card B",
            lunchMoneyAssetId: 222
          })
        ]
      }),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-ignore-related-")), "sync.lock"),
      statementClient,
      budgetProvider,
      logWriter: {
        success: async (line) => void successLines.push(line),
        error: async () => undefined
      },
      now: new Date("2026-05-16T00:00:00")
    });

    expect(result.fetchedCount).toBe(2);
    expect(result.submittedCount).toBe(1);
    expect(budgetProvider.imports).toHaveLength(1);
    expect(budgetProvider.imports[0].transactions).toHaveLength(1);
    expect(budgetProvider.imports[0].transactions[0].external_id).toContain("normal-purchase");
    expect(successLines.join("")).toContain("ignored 1 transfer transactions before Lunch Money");
    expect(successLines.join("")).toContain("submitted 1 eligible transactions to Lunch Money");
    expect(successLines.join("")).toContain("Lunch Money inserted 1 transactions; duplicates/ignored 0");
  });

  it("logs Lunch Money inserted and duplicate counts separately from submitted eligibility", async () => {
    const transactionA = monoStatementItem({ id: "already-imported-a", description: "Coffee" });
    const transactionB = monoStatementItem({ id: "new-transaction-b", description: "Groceries" });
    const statementClient = fakeStatementClient([[transactionA, transactionB]]);
    const budgetProvider = fakeBudgetProvider();
    budgetProvider.importTransactions = async (input) => {
      budgetProvider.imports.push(input);
      return { submitted: input.transactions.length, inserted: 1, duplicatesOrIgnored: 1 };
    };
    const successLines: string[] = [];

    await runSync({
      mode: "sync",
      config: appConfig({
        accounts: [
          accountMapping({
            monoAccountId: "card-b",
            lunchMoneyAccountName: "Card B",
            lunchMoneyAssetId: 222
          })
        ]
      }),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-duplicates-")), "sync.lock"),
      statementClient,
      budgetProvider,
      logWriter: {
        success: async (line) => void successLines.push(line),
        error: async () => undefined
      },
      now: new Date("2026-05-16T00:00:00")
    });

    const logs = successLines.join("");
    expect(logs).toContain("ignored 0 transfer transactions before Lunch Money");
    expect(logs).toContain("submitted 2 eligible transactions to Lunch Money");
    expect(logs).toContain("Lunch Money inserted 1 transactions; duplicates/ignored 1");
  });
});
