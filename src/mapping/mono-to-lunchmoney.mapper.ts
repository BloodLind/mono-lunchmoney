import type { AccountMapping } from "../config/config.model.js";
import type { LunchMoneyInsertTransaction } from "../lunchmoney/lunchmoney-types.js";
import type { MonoStatementItem } from "../monobank/mono-types.js";
import { toLocalIsoDate } from "../utils/date.js";
import { minorUnitsToDecimalString } from "../utils/money.js";
import { buildExternalId } from "./external-id.js";
import { buildNotes } from "./notes-builder.js";

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
