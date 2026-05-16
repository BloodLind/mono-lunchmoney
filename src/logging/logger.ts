import { appendTextCreatingParent } from "../config/runtime-files.js";
import { sanitizeText } from "../utils/masking.js";

export type LogWriter = {
  success(line: string): Promise<void>;
  error(line: string): Promise<void>;
};

export type ConsoleLogStreams = {
  stdout?: Pick<NodeJS.WriteStream, "write">;
  stderr?: Pick<NodeJS.WriteStream, "write">;
};

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

export function formatSyncRecord(message: string, timestamp = new Date()): string {
  return `[${formatLocalTimestamp(timestamp)}] ${sanitizeText(message)}\n`;
}

export async function writeFailureRecord(
  errorLogPath: string,
  record: FailureRecord
): Promise<void> {
  await appendTextCreatingParent(errorLogPath, formatFailureRecord(record));
}

export async function writeSuccessRecord(syncLogPath: string, message: string): Promise<void> {
  await appendTextCreatingParent(syncLogPath, formatSyncRecord(message));
}

export function createFileLogWriter(syncLogPath: string, errorLogPath: string): LogWriter {
  return {
    async success(line: string) {
      await appendTextCreatingParent(syncLogPath, sanitizeText(line));
    },
    async error(line: string) {
      await appendTextCreatingParent(errorLogPath, sanitizeText(line));
    }
  };
}

export function withConsoleLogWriter(
  writer: LogWriter,
  streams: ConsoleLogStreams
): LogWriter {
  return {
    async success(line: string) {
      await writer.success(line);
      streams.stdout?.write(sanitizeText(line));
    },
    async error(line: string) {
      await writer.error(line);
      streams.stderr?.write(sanitizeText(line));
    }
  };
}
