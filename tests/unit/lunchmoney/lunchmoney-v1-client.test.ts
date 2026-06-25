import { describe, expect, it } from "vitest";
import { LunchMoneyV1Client } from "../../../src/lunchmoney/lunchmoney-v1-client.js";
import { monoStatementItem } from "../../fixtures/providers.js";
import { accountMapping } from "../../fixtures/config.js";
import { mapMonoToLunchMoney } from "../../../src/mapping/mono-to-lunchmoney.mapper.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("Lunch Money v1 client", () => {
  it("chunks imports at 500 transactions and sends required options", async () => {
    const bodies: unknown[] = [];
    const client = new LunchMoneyV1Client("token", {
      fetchFn: (async (_url, init) => {
        bodies.push(JSON.parse(String(init?.body)));
        return jsonResponse({ transaction_ids: [1] });
      }) as typeof fetch
    });
    const tx = mapMonoToLunchMoney(monoStatementItem(), accountMapping());
    await client.importTransactions({
      transactions: Array.from({ length: 501 }, (_, index) => ({ ...tx, external_id: `mono:acc:${index}` })),
      applyRules: false,
      skipDuplicates: true,
      checkForRecurring: false,
      debitAsNegative: true,
      skipBalanceUpdate: false
    });

    expect(bodies).toHaveLength(2);
    expect((bodies[0] as { transactions: unknown[] }).transactions).toHaveLength(500);
    expect(bodies[0]).toMatchObject({
      apply_rules: false,
      skip_duplicates: true,
      debit_as_negative: true,
      skip_balance_update: false
    });
  });
});
