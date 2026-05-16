import { describe, expect, it } from "vitest";
import { mapMonoToLunchMoney } from "../../../src/mapping/mono-to-lunchmoney.mapper.js";
import { accountMapping } from "../../fixtures/config.js";
import { monoStatementItem } from "../../fixtures/providers.js";

describe("Monobank to Lunch Money mapper", () => {
  it("maps asset id, tag, status, amount, date, notes, and external id", () => {
    const mapped = mapMonoToLunchMoney(monoStatementItem(), accountMapping());

    expect(mapped).toMatchObject({
      date: "2026-05-15",
      amount: "-420.50",
      currency: "uah",
      payee: "Coffee",
      asset_id: 111,
      status: "uncleared",
      external_id: "mono:mono-account-1:tx-1",
      tags: ["monobank-sync"]
    });
    expect(mapped.notes).toContain("mono_id=tx-1");
  });

  it("uses payee fallbacks", () => {
    const mapped = mapMonoToLunchMoney(
      monoStatementItem({ description: "", counterName: "Counter", comment: "Comment" }),
      accountMapping()
    );

    expect(mapped.payee).toBe("Counter");
  });
});
