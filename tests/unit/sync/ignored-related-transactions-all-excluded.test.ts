import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSync } from "../../../src/sync/sync-runner.js";
import { accountMapping, appConfig, ignoredMonobankAccount } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoTransferFromIgnoredSource } from "../../fixtures/providers.js";
import { sha256Hex } from "../../../src/utils/hash.js";

describe("ignored related transactions during sync when all are excluded", () => {
  it("reports zero eligible imports without submitting an empty Lunch Money batch", async () => {
    const budgetProvider = fakeBudgetProvider();
    const successLines: string[] = [];

    const result = await runSync({
      mode: "sync",
      config: appConfig({
        ignoredMonobankAccounts: [
          ignoredMonobankAccount({
            ibanSha256: sha256Hex("UA987654321098765432109876543")
          })
        ],
        accounts: [accountMapping({ monoAccountId: "imported-card" })]
      }),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-all-excluded-")), "sync.lock"),
      statementClient: fakeStatementClient([[monoTransferFromIgnoredSource()]]),
      budgetProvider,
      logWriter: {
        success: async (line) => void successLines.push(line),
        error: async () => undefined
      },
      now: new Date("2026-05-16T00:00:00")
    });

    expect(result.fetchedCount).toBe(1);
    expect(result.submittedCount).toBe(0);
    expect(result.accounts[0].ignoredTransferCount).toBe(1);
    expect(budgetProvider.imports).toHaveLength(0);
    expect(successLines.join("")).toContain("ignored 1 transfer transactions before Lunch Money");
    expect(successLines.join("")).toContain("submitted 0 eligible transactions to Lunch Money");
    expect(successLines.join("")).toContain("Lunch Money inserted 0 transactions; duplicates/ignored 0");
  });
});
