import type { AccountMapping } from "../config/config.model.js";
import type { MonoStatementItem } from "../monobank/mono-types.js";

const MAX_NOTES_LENGTH = 350;

export function buildNotes(tx: MonoStatementItem, account: AccountMapping): string {
  const required = [
    ["mono_id", tx.id],
    ["mono_acc", account.monoAccountId]
  ] as const;

  const optional: Array<[string, unknown]> = [
    ["mcc", tx.mcc],
    ["hold", tx.hold],
    ["receipt", tx.receiptId],
    ["invoice", tx.invoiceId],
    ["balance", tx.balance],
    ["operationAmount", tx.operationAmount],
    ["currencyCode", tx.currencyCode],
    ["commissionRate", tx.commissionRate],
    ["cashbackAmount", tx.cashbackAmount]
  ];

  const parts = required.map(([key, value]) => `${key}=${compactValue(value, 120)}`);

  for (const [key, value] of optional) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const next = `${key}=${compactValue(value, 80)}`;
    const candidate = [...parts, next].join("; ");
    if (candidate.length <= MAX_NOTES_LENGTH) {
      parts.push(next);
    }
  }

  let notes = parts.join("; ");
  if (notes.length > MAX_NOTES_LENGTH) {
    notes = notes.slice(0, MAX_NOTES_LENGTH);
  }
  return notes;
}

function compactValue(value: unknown, maxLength: number): string {
  const text = String(value).replace(/[;\r\n]/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}
