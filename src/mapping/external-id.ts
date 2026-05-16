import { createHash } from "node:crypto";

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
