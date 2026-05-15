import { appendTextCreatingParent } from "../config/runtime-files.js";
import { sanitizeText } from "../utils/masking.js";

export type FailureRecord = {
  timestamp?: Date;
  source: string;
  message: string;
  exitCode?: number;
  logPath?: string;
};

export function formatLocalTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatFailureRecord(record: FailureRecord): string {
  const timestamp = formatLocalTimestamp(record.timestamp ?? new Date());
  const exitCode = record.exitCode === undefined ? "" : ` exit=${record.exitCode}`;
  return `[${timestamp}] ERROR ${sanitizeText(record.source)}${exitCode}: ${sanitizeText(
    record.message
  )}\n`;
}

export async function writeFailureRecord(
  errorLogPath: string,
  record: FailureRecord
): Promise<void> {
  await appendTextCreatingParent(errorLogPath, formatFailureRecord(record));
}
