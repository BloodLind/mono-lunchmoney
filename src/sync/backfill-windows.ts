import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { parseLocalDate } from "../utils/date.js";

export type BackfillWindow = {
  from: number;
  to: number;
  fromDate: string;
  toDate: string;
};

const MAX_DAYS_PER_WINDOW = 31;

export function splitBackfillWindows(fromDate: string, toDate: string): BackfillWindow[] {
  const start = parseDateOrCliError(fromDate);
  const end = parseDateOrCliError(toDate);
  if (end < start) {
    throw new CliError("--to must be the same as or after --from.", EXIT_CODES.USER_ERROR);
  }

  const windows: BackfillWindow[] = [];
  let cursor = start;

  while (cursor <= end) {
    const windowStart = new Date(cursor);
    const windowEnd = new Date(cursor);
    windowEnd.setDate(windowEnd.getDate() + MAX_DAYS_PER_WINDOW - 1);
    if (windowEnd > end) {
      windowEnd.setTime(end.getTime());
    }

    const from = Math.floor(startOfDay(windowStart).getTime() / 1000);
    const to = Math.floor(endOfDay(windowEnd).getTime() / 1000);
    windows.push({
      from,
      to,
      fromDate: formatDate(windowStart),
      toDate: formatDate(windowEnd)
    });

    cursor = startOfDay(windowEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  return windows;
}

function parseDateOrCliError(value: string): Date {
  try {
    return parseLocalDate(value);
  } catch (error) {
    throw new CliError((error as Error).message, EXIT_CODES.USER_ERROR);
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 0);
}

function formatDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
