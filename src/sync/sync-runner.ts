import {
  getIgnoredMonobankAccountIds,
  getSyncableAccountMappings,
  type AppConfig,
  type AccountMapping
} from "../config/config.model.js";
import type { BudgetProvider } from "../lunchmoney/budget-provider.js";
import { mapMonoToLunchMoney } from "../mapping/mono-to-lunchmoney.mapper.js";
import type { StatementClient } from "../monobank/statement-fetcher.js";
import { fetchAllStatementItems } from "../monobank/statement-fetcher.js";
import { acquireLockFile, type LockCommand } from "../locking/lock-file.js";
import { formatFailureRecord, formatSyncRecord, type LogWriter } from "../logging/logger.js";
import { parseLocalDate } from "../utils/date.js";
import { getIgnoredTransferMatch } from "./ignored-transactions.js";

export type SyncWindow = {
  from: number;
  to: number;
  label?: string;
};

export type SyncRunnerOptions = {
  mode: LockCommand;
  config: AppConfig;
  configPath: string;
  lockPath: string;
  statementClient: StatementClient;
  budgetProvider: BudgetProvider;
  logWriter: LogWriter;
  now?: Date;
  lookbackDays?: number;
  dryRun?: boolean;
  windows?: SyncWindow[];
  rateLimiter?: Parameters<typeof fetchAllStatementItems>[4];
  onStarted?: () => Promise<void>;
};

export type AccountSyncResult = {
  monoAccountId: string;
  displayName: string;
  fetchedCount: number;
  submittedCount: number;
  ignoredTransferCount: number;
  insertedCount?: number;
  duplicateOrIgnoredCount?: number;
  error?: string;
};

export type SyncRunResult = {
  hadFailure: boolean;
  accounts: AccountSyncResult[];
  fetchedCount: number;
  submittedCount: number;
  ignoredTransferCount: number;
  failedCount: number;
};

export async function runSync(options: SyncRunnerOptions): Promise<SyncRunResult> {
  const lock = await acquireLockFile(options.lockPath, options.mode);
  const results: AccountSyncResult[] = [];

  try {
    await options.logWriter.success(formatSyncRecord("Sync started"));
    await options.onStarted?.();
    const ignoredAccountIds = getIgnoredMonobankAccountIds(options.config);
    const ignoredMappedAccounts = options.config.accounts.filter(
      (account) => account.enabled && ignoredAccountIds.has(account.monoAccountId)
    );
    for (const account of ignoredMappedAccounts) {
      await options.logWriter.success(
        formatSyncRecord(
          `Account ${account.lunchMoneyAccountName}: skipped because Monobank account is in ignored list`
        )
      );
    }
    const enabledAccounts = getSyncableAccountMappings(options.config);
    const windows = clampWindowsToBaseline(
      options.windows ?? [
        buildRecentWindow(options.now ?? new Date(), options.lookbackDays ?? options.config.lookbackDays)
      ],
      options.config.baselineDate
    );

    for (const account of enabledAccounts) {
      const result = await processAccount(account, windows, options);
      results.push(result);
    }

    const hadFailure = results.some((result) => result.error);
    await options.logWriter.success(
      formatSyncRecord(hadFailure ? "Sync finished with failures" : "Sync finished successfully")
    );
    return {
      hadFailure,
      accounts: results,
      fetchedCount: results.reduce((sum, result) => sum + result.fetchedCount, 0),
      submittedCount: results.reduce((sum, result) => sum + result.submittedCount, 0),
      ignoredTransferCount: results.reduce(
        (sum, result) => sum + result.ignoredTransferCount,
        0
      ),
      failedCount: results.filter((result) => result.error).length
    };
  } finally {
    await lock.release();
  }
}

function buildRecentWindow(now: Date, lookbackDays: number): SyncWindow {
  const to = Math.floor(now.getTime() / 1000);
  const from = Math.floor((now.getTime() - lookbackDays * 24 * 60 * 60 * 1000) / 1000);
  return { from, to };
}

export function clampWindowsToBaseline(
  windows: SyncWindow[],
  baselineDate: string | undefined
): SyncWindow[] {
  if (!baselineDate) {
    return windows;
  }

  const baselineFrom = Math.floor(parseLocalDate(baselineDate).getTime() / 1000);
  return windows
    .filter((window) => window.to >= baselineFrom)
    .map((window) => ({
      ...window,
      from: Math.max(window.from, baselineFrom)
    }));
}

async function processAccount(
  account: AccountMapping,
  windows: SyncWindow[],
  options: SyncRunnerOptions
): Promise<AccountSyncResult> {
  let fetchedCount = 0;
  let submittedCount = 0;
  let insertedCount = 0;
  let duplicateOrIgnoredCount = 0;
  let ignoredTransferCount = 0;

  try {
    for (const window of windows) {
      const items = await fetchAllStatementItems(
        options.statementClient,
        account.monoAccountId,
        window.from,
        window.to,
        options.rateLimiter
      );
      fetchedCount += items.length;
      const filteredItems = items.filter((item) => {
        const match = getIgnoredTransferMatch(item, options.config.ignoredMonobankAccounts);
        if (match.matched) {
          ignoredTransferCount += 1;
          return false;
        }
        return true;
      });
      const transactions = filteredItems.map((item) => mapMonoToLunchMoney(item, account));
      submittedCount += transactions.length;

      if (!options.dryRun && transactions.length > 0) {
        const importResult = await options.budgetProvider.importTransactions({
          transactions,
          applyRules: false,
          skipDuplicates: true,
          checkForRecurring: false,
          debitAsNegative: true,
          skipBalanceUpdate: true
        });
        insertedCount += importResult.inserted ?? transactions.length;
        duplicateOrIgnoredCount += importResult.duplicatesOrIgnored ?? 0;
      }
    }

    await options.logWriter.success(
      formatSyncRecord(
        `Account ${account.lunchMoneyAccountName}: fetched ${fetchedCount} transactions`
      )
    );
    await options.logWriter.success(
      formatSyncRecord(
        `Account ${account.lunchMoneyAccountName}: ignored ${ignoredTransferCount} transfer transactions before Lunch Money`
      )
    );
    await options.logWriter.success(
      formatSyncRecord(
        `Account ${account.lunchMoneyAccountName}: ${
          options.dryRun ? "dry-run eligible" : "submitted"
        } ${submittedCount} eligible transactions to Lunch Money`
      )
    );
    if (!options.dryRun) {
      await options.logWriter.success(
        formatSyncRecord(
          `Account ${account.lunchMoneyAccountName}: Lunch Money inserted ${insertedCount} transactions; duplicates/ignored ${duplicateOrIgnoredCount}`
        )
      );
    }

    return {
      monoAccountId: account.monoAccountId,
      displayName: account.lunchMoneyAccountName,
      fetchedCount,
      submittedCount,
      ignoredTransferCount,
      insertedCount: options.dryRun ? undefined : insertedCount,
      duplicateOrIgnoredCount: options.dryRun ? undefined : duplicateOrIgnoredCount
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await options.logWriter.error(
      formatFailureRecord({
        source: `sync ${account.lunchMoneyAccountName}`,
        message
      })
    );
    return {
      monoAccountId: account.monoAccountId,
      displayName: account.lunchMoneyAccountName,
      fetchedCount,
      submittedCount,
      ignoredTransferCount,
      error: message
    };
  }
}
