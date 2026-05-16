import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import type { MonoRateLimiter } from "./mono-rate-limiter.js";
import type { MonoStatementItem } from "./mono-types.js";

const MAX_WINDOW_SECONDS = 31 * 24 * 60 * 60 + 60 * 60;

export type StatementClient = {
  getStatement(accountId: string, from: number, to: number): Promise<MonoStatementItem[]>;
};

export async function fetchAllStatementItems(
  client: StatementClient,
  accountId: string,
  from: number,
  to: number,
  options: {
    rateLimiter?: Pick<MonoRateLimiter, "waitTurn">;
  } = {}
): Promise<MonoStatementItem[]> {
  if (to < from) {
    throw new CliError("Statement end timestamp must be after start timestamp.", EXIT_CODES.USER_ERROR);
  }
  if (to - from > MAX_WINDOW_SECONDS) {
    throw new CliError("Monobank statement window must not exceed 31 days plus 1 hour.", EXIT_CODES.USER_ERROR);
  }

  const all: MonoStatementItem[] = [];
  let currentTo = to;

  while (currentTo >= from) {
    await options.rateLimiter?.waitTurn();
    const items = await client.getStatement(accountId, from, currentTo);
    all.push(...items);

    if (items.length < 500) {
      break;
    }

    const oldestTime = Math.min(...items.map((item) => item.time));
    currentTo = oldestTime - 1;
  }

  return dedupeByMonoId(all);
}

export function dedupeByMonoId(items: MonoStatementItem[]): MonoStatementItem[] {
  const seen = new Set<string>();
  const result: MonoStatementItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    result.push(item);
  }

  return result;
}
