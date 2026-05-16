import type { IgnoredMonobankAccount } from "../config/config.model.js";
import type { MonoStatementItem } from "../monobank/mono-types.js";
import { sanitizeText, sha256Hex } from "../utils/masking.js";

export type IgnoredTransferMatchReason = "counter-iban" | "masked-pan" | "none";

export type IgnoredTransferMatch = {
  matched: boolean;
  reason: IgnoredTransferMatchReason;
  sourceDisplayName?: string;
};

export function isTransactionRelatedToIgnoredAccount(
  tx: MonoStatementItem,
  ignoredAccounts: IgnoredMonobankAccount[]
): boolean {
  return getIgnoredTransferMatch(tx, ignoredAccounts).matched;
}

export function getIgnoredTransferMatch(
  tx: MonoStatementItem,
  ignoredAccounts: IgnoredMonobankAccount[]
): IgnoredTransferMatch {
  const active = ignoredAccounts.filter((account) => account.enabled);
  if (active.length === 0) {
    return noMatch();
  }

  if (tx.counterIban) {
    const counterIbanHash = sha256Hex(tx.counterIban);
    const account = active.find((candidate) => candidate.ibanSha256 === counterIbanHash);
    if (account) {
      return {
        matched: true,
        reason: "counter-iban",
        sourceDisplayName: sanitizeText(account.monoDisplayName)
      };
    }
  }

  const text = normalizeText([tx.description, tx.counterName, tx.comment].filter(Boolean).join(" "));
  if (!text) {
    return noMatch();
  }

  const account = active.find(
    (candidate) => candidate.maskedPan && textMatchesMaskedPan(text, candidate.maskedPan)
  );
  if (account) {
    return {
      matched: true,
      reason: "masked-pan",
      sourceDisplayName: sanitizeText(account.monoDisplayName)
    };
  }

  return noMatch();
}

function noMatch(): IgnoredTransferMatch {
  return { matched: false, reason: "none" };
}

function textMatchesMaskedPan(normalizedText: string, maskedPan: string): boolean {
  const normalizedPan = normalizeText(maskedPan);
  if (normalizedPan && normalizedText.includes(normalizedPan)) {
    return true;
  }

  const last4 = maskedPan.match(/(\d{4})\D*$/)?.[1];
  if (!last4) {
    return false;
  }

  return (
    normalizedText.includes(`*${last4}`) ||
    normalizedText.includes(`**${last4}`) ||
    normalizedText.includes(`***${last4}`) ||
    normalizedText.includes(`****${last4}`)
  );
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[-_]/g, "");
}
