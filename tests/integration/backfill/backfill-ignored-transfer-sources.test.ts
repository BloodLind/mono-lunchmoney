import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { splitBackfillWindows } from "../../../src/sync/backfill-windows.js";
import { runSync } from "../../../src/sync/sync-runner.js";
import { accountMapping, appConfig, ignoredMonobankAccount } from "../../fixtures/config.js";
import {
  fakeBudgetProvider,
  fakeStatementClient,
  monoStatementItem,
  monoTransferFromIgnoredSource
} from "../../fixtures/providers.js";
import { sha256Hex } from "../../../src/utils/masking.js";

describe("backfill ignored transfer sources", () => {
  it("uses the shared ignored transfer filtering for backfill windows", async () => {
    const provider = fakeBudgetProvider();

    const result = await runSync({
      mode: "backfill",
      config: appConfig({
        ignoredMonobankAccounts: [
          ignoredMonobankAccount({
            ibanSha256: sha256Hex("UA987654321098765432109876543")
          })
        ],
        accounts: [accountMapping({ monoAccountId: "imported-card" })]
      }),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-backfill-ignore-transfer-")), "sync.lock"),
      statementClient: fakeStatementClient([
        [
          monoTransferFromIgnoredSource(),
          monoStatementItem({ id: "normal-backfill-purchase", description: "Coffee" })
        ]
      ]),
      budgetProvider: provider,
      logWriter: { success: async () => undefined, error: async () => undefined },
      windows: splitBackfillWindows("2026-05-01", "2026-05-15")
    });

    expect(result.fetchedCount).toBe(2);
    expect(result.submittedCount).toBe(1);
    expect(result.accounts[0].ignoredTransferCount).toBe(1);
    expect(provider.imports).toHaveLength(1);
    expect(provider.imports[0].transactions[0].external_id).toContain("normal-backfill-purchase");
  });
});
