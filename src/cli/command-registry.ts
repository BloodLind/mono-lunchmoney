export const APP_NAME = "mono-lunchmoney";
export const APP_VERSION = "0.1.0";

export const DEFAULT_TAG = "monobank-sync";
export const DEFAULT_DAILY_AT = "20:00";
export const DEFAULT_TASK_NAME = "MonoLunchMoneySync";
export const APP_DIRECTORY_NAME = "mono-lunchmoney";

export const EXIT_CODES = {
  OK: 0,
  USER_ERROR: 1,
  EXTERNAL_ERROR: 2,
  LOCKED: 3
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export const COMMAND_NAMES = ["setup", "sync", "backfill", "scheduler", "config", "help"] as const;
