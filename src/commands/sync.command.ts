import { Command } from "commander";
import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { loadConfig } from "../config/config.loader.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { resolveProviderTokens } from "../config/tokens.js";
import { createFileLogWriter, writeFailureRecord, type LogWriter } from "../logging/logger.js";
import type { BudgetProvider } from "../lunchmoney/budget-provider.js";
import { LunchMoneyV1Client } from "../lunchmoney/lunchmoney-v1-client.js";
import { MonobankClient } from "../monobank/mono-client.js";
import { MonoRateLimiter } from "../monobank/mono-rate-limiter.js";
import type { StatementClient } from "../monobank/statement-fetcher.js";
import { handleNotificationEvent } from "../notifications/notification-service.js";
import type { NotificationAdapter, NotificationEvent } from "../notifications/notification-types.js";
import { WindowsNotifier } from "../notifications/windows-notifier.js";
import { runSync } from "../sync/sync-runner.js";

export type SyncOptions = {
  config?: string;
  quiet?: boolean;
  dryRun?: boolean;
  lookbackDays?: string;
};

export type SyncDeps = {
  env?: NodeJS.ProcessEnv;
  stderr?: Pick<NodeJS.WriteStream, "write">;
  statementClient?: StatementClient;
  budgetProvider?: BudgetProvider;
  logWriter?: LogWriter;
  notificationAdapter?: NotificationAdapter;
  rateLimiter?: Parameters<typeof runSync>[0]["rateLimiter"];
  now?: Date;
};

export async function runSyncCommand(options: SyncOptions, deps: SyncDeps = {}): Promise<void> {
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const loaded = loadConfig(paths.configPath);
  const logWriter = deps.logWriter ?? createFileLogWriter(paths.syncLogPath, paths.errorLogPath);

  if (!loaded.exists) {
    const message = `Config not found: ${paths.configPath}`;
    await writeFailureRecord(paths.errorLogPath, {
      source: "sync",
      message,
      exitCode: EXIT_CODES.USER_ERROR,
      logPath: paths.errorLogPath
    });
    if (!options.quiet) {
      deps.stderr?.write(`${message}\n`);
    }
    throw new CliError(message, EXIT_CODES.USER_ERROR);
  }

  const notificationAdapter = deps.notificationAdapter ?? new WindowsNotifier();
  let alreadyNotified = false;

  try {
    const enabledAccounts = loaded.config.accounts.filter((account) => account.enabled);
    if (enabledAccounts.length === 0) {
      throw new CliError("Config has no enabled account mappings.", EXIT_CODES.USER_ERROR);
    }

    const tokens =
      deps.statementClient && deps.budgetProvider ? undefined : resolveProviderTokens(deps.env);
    const monoClient = deps.statementClient ?? new MonobankClient(tokens!.monoToken);
    const budgetProvider = deps.budgetProvider ?? new LunchMoneyV1Client(tokens!.lunchMoneyToken);
    const lookbackDays = options.lookbackDays === undefined ? undefined : Number(options.lookbackDays);
    if (
      lookbackDays !== undefined &&
      (!Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 31)
    ) {
      throw new CliError("--lookback-days must be an integer from 1 to 31.", EXIT_CODES.USER_ERROR);
    }

    const result = await runSync({
      mode: "sync",
      config: loaded.config,
      configPath: paths.configPath,
      lockPath: paths.lockPath,
      statementClient: monoClient,
      budgetProvider,
      logWriter,
      now: deps.now,
      lookbackDays,
      dryRun: options.dryRun,
      rateLimiter:
        deps.rateLimiter ?? (deps.statementClient ? undefined : { rateLimiter: new MonoRateLimiter() })
    });

    if (result.hadFailure) {
      alreadyNotified = true;
      await notifySyncEvent({
        config: loaded.config.notifications,
        event: {
          type: "sync-partial-failure",
          sourceCommand: "sync",
          quiet: Boolean(options.quiet),
          summary: "Sync finished with one or more account failures.",
          details: result.accounts
            .filter((account) => account.error)
            .map((account) => `${account.displayName}: ${account.error}`)
            .join("; "),
          logPath: paths.errorLogPath,
          occurredAt: new Date()
        },
        adapter: notificationAdapter,
        logWriter
      });
      throw new CliError("Sync finished with one or more account failures.", EXIT_CODES.EXTERNAL_ERROR);
    }

    await notifySyncEvent({
      config: loaded.config.notifications,
      event: {
        type: "sync-success",
        sourceCommand: "sync",
        quiet: Boolean(options.quiet),
        summary: "Sync finished successfully.",
        logPath: paths.syncLogPath,
        occurredAt: new Date()
      },
      adapter: notificationAdapter,
      logWriter
    });
  } catch (error) {
    if (!alreadyNotified) {
      const isLocked = error instanceof CliError && error.exitCode === EXIT_CODES.LOCKED;
      await notifySyncEvent({
        config: loaded.config.notifications,
        event: {
          type: isLocked ? "lock-held" : "sync-failure",
          sourceCommand: "sync",
          quiet: Boolean(options.quiet),
          summary: isLocked ? "Sync is already running." : "Sync failed.",
          details: error instanceof Error ? error.message : String(error),
          logPath: paths.errorLogPath,
          occurredAt: new Date()
        },
        adapter: notificationAdapter,
        logWriter
      });
    }
    throw error;
  }
}

async function notifySyncEvent(input: {
  config: Parameters<typeof handleNotificationEvent>[0]["config"];
  event: NotificationEvent;
  adapter: NotificationAdapter;
  logWriter: LogWriter;
}): Promise<void> {
  await handleNotificationEvent({
    config: input.config,
    event: input.event,
    adapter: input.adapter,
    logger: input.logWriter
  });
}

export function createSyncCommand(deps: SyncDeps = {}): Command {
  return new Command("sync")
    .description("Import recent mapped transactions")
    .option("--config <path>", "explicit config path")
    .option("--quiet", "suppress non-error output for scheduled use")
    .option("--dry-run", "preview sync without importing")
    .option("--lookback-days <days>", "recent sync lookback days")
    .action((options: SyncOptions) => runSyncCommand(options, deps));
}
