import { Command } from "commander";
import { CliError, EXIT_CODES } from "../cli/command-registry.js";
import { loadConfig } from "../config/config.loader.js";
import { getSyncableAccountMappings } from "../config/config.model.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { createDefaultCredentialStore, resolveProviderTokens } from "../config/tokens.js";
import type { CredentialStore } from "../credentials/credential-store.js";
import { createFileLogWriter, withConsoleLogWriter, type LogWriter } from "../logging/logger.js";
import type { BudgetProvider } from "../lunchmoney/lunchmoney-types.js";
import { LunchMoneyV1Client } from "../lunchmoney/lunchmoney-v1-client.js";
import { MonobankClient } from "../monobank/mono-client.js";
import { MonoRateLimiter } from "../monobank/mono-rate-limiter.js";
import type { StatementClient } from "../monobank/statement-fetcher.js";
import { handleNotificationEvent } from "../notifications/notification-service.js";
import type { NotificationAdapter, NotificationEvent } from "../notifications/notification-types.js";
import { WindowsNotifier } from "../notifications/windows-notifier.js";
import { splitBackfillWindows } from "../sync/backfill-windows.js";
import { runSync } from "../sync/sync-runner.js";

export type BackfillOptions = {
  config?: string;
  from?: string;
  to?: string;
  quiet?: boolean;
  dryRun?: boolean;
};

export type BackfillDeps = {
  env?: NodeJS.ProcessEnv;
  stdout?: Pick<NodeJS.WriteStream, "write">;
  stderr?: Pick<NodeJS.WriteStream, "write">;
  statementClient?: StatementClient;
  budgetProvider?: BudgetProvider;
  logWriter?: LogWriter;
  notificationAdapter?: NotificationAdapter;
  rateLimiter?: Parameters<typeof runSync>[0]["rateLimiter"];
  credentialStore?: CredentialStore;
  createStatementClient?: (token: string) => StatementClient;
  createBudgetProvider?: (token: string) => BudgetProvider;
};

export async function runBackfillCommand(
  options: BackfillOptions,
  deps: BackfillDeps = {}
): Promise<void> {
  if (!options.from || !options.to) {
    throw new CliError("Backfill requires --from and --to.", EXIT_CODES.USER_ERROR);
  }

  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const loaded = loadConfig(paths.configPath);
  if (!loaded.exists) {
    throw new CliError(`Config not found: ${paths.configPath}`, EXIT_CODES.USER_ERROR);
  }
  if (getSyncableAccountMappings(loaded.config).length === 0) {
    throw new CliError(
      "Config has no enabled account mappings outside the ignored Monobank account list.",
      EXIT_CODES.USER_ERROR
    );
  }

  const baseLogWriter = deps.logWriter ?? createFileLogWriter(paths.syncLogPath, paths.errorLogPath);
  const logWriter = options.quiet
    ? baseLogWriter
    : withConsoleLogWriter(baseLogWriter, { stdout: deps.stdout, stderr: deps.stderr });
  const notificationAdapter = deps.notificationAdapter ?? new WindowsNotifier();
  let alreadyNotified = false;

  try {
    const tokens =
      deps.statementClient && deps.budgetProvider
        ? undefined
        : await resolveProviderTokens(
            deps.env,
            deps.credentialStore ?? createDefaultCredentialStore(deps.env ?? process.env)
          );
    const windows = splitBackfillWindows(options.from, options.to);
    const result = await runSync({
      mode: "backfill",
      config: loaded.config,
      configPath: paths.configPath,
      lockPath: paths.lockPath,
      statementClient:
        deps.statementClient ??
        (deps.createStatementClient ?? ((token: string) => new MonobankClient(token)))(tokens!.monoToken),
      budgetProvider:
        deps.budgetProvider ??
        (deps.createBudgetProvider ?? ((token: string) => new LunchMoneyV1Client(token)))(
          tokens!.lunchMoneyToken
        ),
      logWriter,
      windows,
      dryRun: options.dryRun,
      rateLimiter:
        deps.rateLimiter ?? (deps.statementClient ? undefined : { rateLimiter: new MonoRateLimiter() }),
      onStarted: () =>
        notifyBackfillEvent({
          config: loaded.config.notifications,
          event: {
            type: "sync-started",
            sourceCommand: "backfill",
            quiet: Boolean(options.quiet),
            summary: "Backfill started.",
            logPath: paths.syncLogPath,
            occurredAt: new Date()
          },
          adapter: notificationAdapter,
          logWriter
        })
    });

    if (result.hadFailure) {
      alreadyNotified = true;
      await notifyBackfillEvent({
        config: loaded.config.notifications,
        event: {
          type: "sync-partial-failure",
          sourceCommand: "backfill",
          quiet: Boolean(options.quiet),
          summary: "Backfill finished with one or more account failures.",
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
      throw new CliError("Backfill finished with one or more account failures.", EXIT_CODES.EXTERNAL_ERROR);
    }

    await notifyBackfillEvent({
      config: loaded.config.notifications,
      event: {
        type: "sync-success",
        sourceCommand: "backfill",
        quiet: Boolean(options.quiet),
        summary: "Backfill finished successfully.",
        logPath: paths.syncLogPath,
        occurredAt: new Date()
      },
      adapter: notificationAdapter,
      logWriter
    });
  } catch (error) {
    if (!alreadyNotified) {
      const isLocked = error instanceof CliError && error.exitCode === EXIT_CODES.LOCKED;
      await notifyBackfillEvent({
        config: loaded.config.notifications,
        event: {
          type: isLocked ? "lock-held" : "sync-failure",
          sourceCommand: "backfill",
          quiet: Boolean(options.quiet),
          summary: isLocked ? "Backfill is already running." : "Backfill failed.",
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

async function notifyBackfillEvent(input: {
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

export function createBackfillCommand(deps: BackfillDeps = {}): Command {
  return new Command("backfill")
    .description("Import historical transactions for a date range")
    .option("--config <path>", "explicit config path")
    .option("--from <date>", "start date in YYYY-MM-DD")
    .option("--to <date>", "end date in YYYY-MM-DD")
    .option("--quiet", "suppress non-error output")
    .option("--dry-run", "preview backfill without importing")
    .action((options: BackfillOptions) => runBackfillCommand(options, deps));
}
