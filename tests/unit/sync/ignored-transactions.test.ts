import { describe, expect, it } from "vitest";
import {
  getIgnoredTransferMatch,
  isTransactionRelatedToIgnoredAccount
} from "../../../src/sync/ignored-transactions.js";
import { ignoredMonobankAccount } from "../../fixtures/config.js";
import { sha256Hex } from "../../../src/utils/hash.js";
import { monoStatementItem } from "../../fixtures/providers.js";

describe("ignored transaction matching", () => {
  it("matches transactions whose counterparty IBAN belongs to an ignored account", () => {
    const match = getIgnoredTransferMatch(monoStatementItem({ counterIban: "UA123456789012345678901234567" }), [
      ignoredMonobankAccount({
        monoDisplayName: "Ignored 5555444433332222",
        ibanSha256: sha256Hex("UA123456789012345678901234567")
      })
    ]);

    expect(match).toMatchObject({
      matched: true,
      reason: "counter-iban",
      sourceDisplayName: "Ignored 5555...2222"
    });
  });

  it("matches transactions whose text contains an ignored masked card suffix", () => {
    expect(
      isTransactionRelatedToIgnoredAccount(
        monoStatementItem({ description: "Transfer from card *2222" }),
        [ignoredMonobankAccount({ maskedPan: "4444******2222" })]
      )
    ).toBe(true);
  });

  it("does not match disabled ignored accounts", () => {
    expect(
      isTransactionRelatedToIgnoredAccount(
        monoStatementItem({ description: "Transfer from card *2222" }),
        [ignoredMonobankAccount({ enabled: false, maskedPan: "4444******2222" })]
      )
    ).toBe(false);
  });

  it("does not match ambiguous transfer text without ignored source metadata", () => {
    expect(
      getIgnoredTransferMatch(
        monoStatementItem({ description: "Transfer between own cards" }),
        [ignoredMonobankAccount({ maskedPan: undefined, ibanSha256: undefined })]
      )
    ).toEqual({ matched: false, reason: "none" });
  });
});
