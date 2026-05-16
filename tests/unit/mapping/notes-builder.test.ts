import { describe, expect, it } from "vitest";
import { buildNotes } from "../../../src/mapping/notes-builder.js";
import { accountMapping } from "../../fixtures/config.js";
import { monoStatementItem } from "../../fixtures/providers.js";

describe("notes builder", () => {
  it("includes required Monobank keys and optional metadata", () => {
    const notes = buildNotes(monoStatementItem({ receiptId: "receipt-1" }), accountMapping());

    expect(notes).toContain("mono_id=tx-1");
    expect(notes).toContain("mono_acc=mono-account-1");
    expect(notes).toContain("mcc=5814");
    expect(notes).toContain("receipt=receipt-1");
  });

  it("keeps notes within Lunch Money's 350-character limit", () => {
    const notes = buildNotes(
      monoStatementItem({
        id: "x".repeat(200),
        receiptId: "r".repeat(200),
        invoiceId: "i".repeat(200)
      }),
      accountMapping({ monoAccountId: "a".repeat(200) })
    );

    expect(notes.length).toBeLessThanOrEqual(350);
  });
});
