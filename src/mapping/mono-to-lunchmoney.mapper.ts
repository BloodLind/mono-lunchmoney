import { createHash } from "node:crypto";
import type { AccountMapping } from "../config/config.model.js";
import type { LunchMoneyInsertTransaction } from "../lunchmoney/lunchmoney-types.js";
import type { MonoStatementItem } from "../monobank/mono-types.js";
import { toLocalIsoDate } from "../utils/date.js";
import { minorUnitsToDecimalString } from "../utils/money.js";
import { buildNotes } from "./notes-builder.js";

const MAX_EXTERNAL_ID_LENGTH = 75;

export function buildExternalId(monoAccountId: string, monoTransactionId: string): string {
  const raw = `mono:${monoAccountId}:${monoTransactionId}`;
  if (raw.length <= MAX_EXTERNAL_ID_LENGTH) {
    return raw;
  }

  return `mono:${shortHash(monoAccountId, 16)}:${shortHash(monoTransactionId, 32)}`;
}

function shortHash(value: string, length: number): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

export function mapMonoToLunchMoney(
  tx: MonoStatementItem,
  account: AccountMapping
): LunchMoneyInsertTransaction {
  return {
    date: toLocalIsoDate(tx.time),
    amount: minorUnitsToDecimalString(tx.amount, account.currency),
    currency: account.currency,
    payee: buildPayee(tx),
    asset_id: account.lunchMoneyAssetId,
    status: "uncleared",
    external_id: buildExternalId(account.monoAccountId, tx.id),
    tags: [account.tag],
    notes: buildNotes(tx, account)
  };
}

export function buildPayee(tx: MonoStatementItem): string {
  return (
    tx.description?.trim() ||
    tx.counterName?.trim() ||
    tx.comment?.trim() ||
    "Monobank transaction"
  ).slice(0, 140);
}
