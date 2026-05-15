# Data Model: Monobank to Lunch Money Sync

## SyncConfiguration

Represents saved user settings. Persisted in `config.json`.

**Fields**:

- `schemaVersion: number` - positive integer, initially `1`.
- `lunchMoneyApiVersion: "v1"` - first implementation targets v1 only.
- `lookbackDays: number` - integer from 1 to 31, default `31`.
- `defaultTag: string` - non-empty, default `monobank-sync`.
- `scheduler?: SchedulerConfig` - optional scheduled task settings.
- `accounts: AccountMapping[]` - tracked account mappings.

**Validation rules**:

- Must not contain API tokens.
- Must contain at least one enabled `AccountMapping` for `sync` or `backfill`.
- Unknown keys may be preserved for forward compatibility but must not be used as
  imported transaction progress.

## SchedulerConfig

Represents saved scheduler preferences.

**Fields**:

- `enabled: boolean`
- `type: "windows-task-scheduler"`
- `dailyAt: string` - `HH:mm` 24-hour local time.
- `taskName: string` - non-empty, default `MonoLunchMoneySync`.

**Validation rules**:

- Scheduled command must include `sync --config <path> --quiet`.
- Scheduled command must not include token-like arguments.

## AccountMapping

Saved relationship between one Monobank source and one Lunch Money manual
account.

**Fields**:

- `enabled: boolean`
- `monoAccountId: string`
- `monoDisplayName: string`
- `monoType?: string`
- `monoCurrencyCode: number`
- `currency: string` - lower-case ISO currency code such as `uah`.
- `lunchMoneyAssetId: number`
- `lunchMoneyAccountName: string`
- `tag: string`
- `externalIdPrefix: string`

**Validation rules**:

- `monoAccountId`, `monoDisplayName`, `currency`, `lunchMoneyAccountName`,
  `tag`, and `externalIdPrefix` must be non-empty.
- `externalIdPrefix` should be `mono:<monoAccountId>` unless shortened display
  needs are introduced later.
- Financial identifiers shown in summaries must be masked.

**State transitions**:

- `enabled: true` mappings are processed by sync/backfill.
- `enabled: false` mappings remain in config but are skipped.

## MonobankSource

Transient provider source discovered during setup from client info.

**Fields**:

- `accountId: string`
- `displayName: string`
- `type?: string`
- `currencyCode: number`
- `currency: string`
- `balanceMinor?: number`
- `maskedPan?: string`
- `maskedIban?: string`
- `isFop?: boolean`

**Validation rules**:

- Full PAN and IBAN must not be displayed or logged.
- Jars are excluded unless a later explicit jar option is added.

## BudgetAccount

Lunch Money manual account surfaced through `BudgetProvider`.

**Fields**:

- `id: number`
- `name: string`
- `currency: string`
- `typeName?: string`
- `institutionName?: string`
- `balance?: string`

**Validation rules**:

- Setup must map only to manual assets/accounts exposed by the provider.
- Created Monobank debit/current accounts default to `type_name: "cash"`.

## ImportedTransaction

Transient mapped transaction submitted to Lunch Money.

**Fields**:

- `date: string` - local `YYYY-MM-DD`.
- `amount: string` - decimal string.
- `currency: string`
- `payee: string`
- `asset_id: number`
- `status: "uncleared"`
- `external_id: string`
- `tags: string[]`
- `notes?: string`

**Validation rules**:

- `external_id` must be deterministic and at most 75 characters.
- `status` must always be `uncleared`.
- `tags` must include the account mapping's configured tag.
- `asset_id` must equal the mapped Lunch Money asset id.
- `notes` must be at most 350 characters and include `mono_id` and `mono_acc`
  unless the source identifier is already represented by `external_id`.

## MonobankStatementItem

Transient item returned by Monobank statement API.

**Fields used**:

- `id: string`
- `time: number`
- `description?: string`
- `counterName?: string`
- `comment?: string`
- `amount: number`
- `operationAmount?: number`
- `currencyCode?: number`
- `mcc?: number`
- `hold?: boolean`
- `receiptId?: string`
- `invoiceId?: string`
- `balance?: number`
- `commissionRate?: number`
- `cashbackAmount?: number`

**Validation rules**:

- Items are deduplicated by `id` within a fetch response set.
- Fetch paging moves `to` to the oldest returned `time - 1` when exactly 500
  items are returned.

## SyncRun

Runtime-only orchestration record. Not persisted beyond log lines.

**Fields**:

- `startedAt: Date`
- `mode: "sync" | "backfill" | "dry-run"`
- `configPath: string`
- `accounts: AccountSyncResult[]`
- `hadFailure: boolean`

**Validation rules**:

- Must not be used as an imported transaction cursor.
- Exit code is non-zero when `hadFailure` is true.

## AccountSyncResult

Runtime-only per-account outcome.

**Fields**:

- `monoAccountId: string`
- `displayName: string`
- `fetchedCount: number`
- `submittedCount: number`
- `insertedCount?: number`
- `duplicateOrIgnoredCount?: number`
- `error?: string`

**Validation rules**:

- Logs should use display name or masked/short identifiers.
- A failure for one account does not prevent later accounts from running when
  the failure is isolated and rate-limit state remains usable.

## LockFile

Runtime coordination file at `sync.lock`.

**Fields**:

- `pid: number`
- `createdAt: string`
- `command: "sync" | "backfill"`

**Validation rules**:

- Created atomically using exclusive file creation.
- Existing live lock exits with `EXIT_CODES.LOCKED`.
- Existing stale lock older than six hours is removed before continuing.
- Lock metadata is coordination state only and not transaction progress.

## ScheduledSyncTask

Windows Task Scheduler registration.

**Fields**:

- `taskName: string`
- `dailyAt: string`
- `execute: string`
- `arguments: string[]`
- `nextRunTime?: string`
- `lastRunTime?: string`
- `lastResultCode?: number`

**Validation rules**:

- Arguments must include `sync --config <path> --quiet`.
- Arguments must not include API tokens.
- Multiple instances setting must ignore a new start when a previous run is
  still running.
