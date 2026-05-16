# Codex Agent Implementation Spec: Monobank → Lunch Money Stateless Transaction Sync

## 1. Goal

Build a local Windows-friendly CLI application that imports selected Monobank card/account transactions into Lunch Money.

The application must be usable without a permanent server. It should support a one-time interactive setup stage, a non-interactive sync stage, and a Windows background scheduled task that runs the sync once per day.

Primary design principle:

```text
No local transaction database. Lunch Money is used as the idempotent storage target.
```

The app may store configuration such as account mappings, selected cards, tag names, scheduler settings, and file paths. It must not store imported transaction state such as “last transaction id” or “last synced timestamp” as the source of truth.

---

## 2. Core Requirements

### 2.1 Functional requirements

1. Fetch Monobank client info and available personal/FOP accounts/cards.
2. Let the user choose which Monobank accounts/cards should be tracked.
3. For every tracked Monobank account/card, map it to a dedicated Lunch Money manually-managed account.
4. During setup, allow the user to either:

   * map a Monobank account/card to an existing Lunch Money manual account, or
   * create a new Lunch Money manual account and map to it.
5. Sync transactions from Monobank into Lunch Money.
6. Imported transactions must be created as not verified/review-pending. In Lunch Money API terms, use `status: "uncleared"`.
7. Transactions must not be duplicated across repeated runs.
8. Every transaction imported by this script must have a specific tag, for example `monobank-sync`.
9. Each imported transaction should include compact Monobank metadata in Lunch Money `notes`, for example transaction id, Monobank account id, MCC, hold flag, receipt id, and balance.
10. The app must support daily background execution on Windows through Windows Task Scheduler.
11. The scheduled sync must be non-interactive.
12. The sync must be safe to rerun manually at any time.
13. The sync must be safe after crashes; rerunning should not duplicate transactions.

### 2.2 Non-functional requirements

1. Prefer TypeScript + Node.js.
2. Keep architecture simple and maintainable.
3. Avoid a hosted server.
4. Avoid a local database.
5. Store only static/semi-static config.
6. Do not put API tokens in scheduled task command arguments.
7. Keep logs readable for debugging.
8. Respect Monobank API rate limits.
9. Keep Lunch Money API behind an adapter/interface so v1/v2 differences can be isolated later.

---

## 3. Recommended CLI Commands

Required commands:

```bash
mono-lunchmoney setup
mono-lunchmoney sync
mono-lunchmoney scheduler install --daily-at 20:00
mono-lunchmoney scheduler uninstall
mono-lunchmoney scheduler status
mono-lunchmoney config show
```

Optional commands:

```bash
mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15
mono-lunchmoney setup --reconfigure
mono-lunchmoney sync --dry-run
mono-lunchmoney sync --lookback-days 31
```

Command behavior:

| Command               |                 Interactive | Purpose                                                                          |
| --------------------- | --------------------------: | -------------------------------------------------------------------------------- |
| `setup`               |                         yes | Fetch accounts, ask what to track, map/create Lunch Money accounts, save config. |
| `sync`                |                          no | Read config and import recent transactions.                                      |
| `backfill`            | no or minimally interactive | Import historical transactions by monthly windows.                               |
| `scheduler install`   |           yes or args-based | Create Windows Task Scheduler job.                                               |
| `scheduler uninstall` |                          no | Remove scheduled task.                                                           |
| `scheduler status`    |                          no | Show whether scheduled task exists and basic status.                             |
| `config show`         |                          no | Print sanitized config without secrets.                                          |

---

## 4. External APIs

### 4.1 Monobank API

Use personal Monobank API token from environment or secure user-level storage.

Required endpoints:

```text
GET /personal/client-info
GET /personal/statement/{account}/{from}/{to}
```

Auth header:

```text
X-Token: <MONO_TOKEN>
```

Important Monobank behavior:

1. `GET /personal/client-info` returns client data, accounts, jars, and managed clients/FOP accounts where available.
2. `GET /personal/statement/{account}/{from}/{to}` returns statement items for the selected account.
3. Statement period is limited to 31 days + 1 hour.
4. Statement endpoint is limited to one request per 60 seconds.
5. Statement endpoint returns up to 500 transactions from `to` backwards.
6. If exactly 500 transactions are returned, request again with `to` moved to the timestamp of the oldest returned transaction minus one second. Repeat until fewer than 500 are returned.

### 4.2 Lunch Money API

Initial implementation should use Lunch Money API v1 because it is stable and directly supports this flow.

Required endpoints:

```text
GET /v1/assets
POST /v1/assets
POST /v1/transactions
```

Auth header:

```text
Authorization: Bearer <LUNCHMONEY_TOKEN>
```

Important Lunch Money v1 behavior:

1. `GET /v1/assets` returns manually-managed accounts/assets.
2. `POST /v1/assets` creates a manually-managed account/asset.
3. `POST /v1/transactions` inserts up to 500 transactions per request.
4. Transaction `status` must be `cleared` or `uncleared`; default is `uncleared`, but set it explicitly.
5. Use `asset_id` to attach imported transactions to a manually-managed Lunch Money account.
6. `asset_id` and `plaid_account_id` must not both be set.
7. Use `external_id` for idempotency. External ids are max 75 characters and unique within the same `asset_id`.
8. Lunch Money deduplicates by `external_id` regardless of the `skip_duplicates` flag.
9. Use `tags` array to attach the configured sync tag. In v1, tag strings can be used and Lunch Money can create the tag if it does not exist.
10. `notes` max length is 350 characters; store compact metadata only.

---

## 5. Configuration

### 5.1 Config file location

Default Windows location:

```text
%APPDATA%\mono-lunchmoney\config.json
%APPDATA%\mono-lunchmoney\sync.log
%APPDATA%\mono-lunchmoney\error.log
%APPDATA%\mono-lunchmoney\sync.lock
```

The app should also support explicit config path:

```bash
mono-lunchmoney sync --config "C:\path\config.json"
```

### 5.2 Config example

```json
{
  "schemaVersion": 1,
  "lunchMoneyApiVersion": "v1",
  "lookbackDays": 31,
  "defaultTag": "monobank-sync",
  "scheduler": {
    "enabled": true,
    "type": "windows-task-scheduler",
    "dailyAt": "20:00",
    "taskName": "MonoLunchMoneySync"
  },
  "accounts": [
    {
      "enabled": true,
      "monoAccountId": "abc123",
      "monoDisplayName": "Mono Black UAH ****1234",
      "monoType": "black",
      "monoCurrencyCode": 980,
      "currency": "uah",
      "lunchMoneyAssetId": 111111,
      "lunchMoneyAccountName": "Monobank Black UAH",
      "tag": "monobank-sync",
      "externalIdPrefix": "mono:abc123"
    },
    {
      "enabled": true,
      "monoAccountId": "fop456",
      "monoDisplayName": "Mono FOP UAH",
      "monoType": "fop",
      "monoCurrencyCode": 980,
      "currency": "uah",
      "lunchMoneyAssetId": 222222,
      "lunchMoneyAccountName": "Monobank FOP UAH",
      "tag": "monobank-fop-sync",
      "externalIdPrefix": "mono:fop456"
    }
  ]
}
```

### 5.3 What must not be stored in config

Do not store API tokens in plain config by default.

Preferred token sources:

1. User-level environment variables:

```text
MONO_TOKEN
LUNCHMONEY_TOKEN
```

2. Optional Windows Credential Manager integration in a later iteration.

Do not pass tokens as CLI arguments for scheduled jobs.

---

## 6. Setup Stage

Command:

```bash
mono-lunchmoney setup
```

### 6.1 Setup flow

1. Resolve tokens from environment or secure storage.
2. Validate Monobank token by calling `GET /personal/client-info`.
3. Validate Lunch Money token by calling `GET /v1/assets`.
4. Flatten available Monobank sources:

   * personal accounts/cards,
   * FOP/managed client accounts where available,
   * optionally jars only if user explicitly enables jar support.
5. Display Monobank accounts/cards with enough information:

   * type,
   * masked PAN when available,
   * currency,
   * balance,
   * IBAN if useful,
   * account id shortened for display.
6. Ask for each Monobank source:

   * track or skip.
7. For each tracked source:

   * show existing Lunch Money assets,
   * ask whether to map to existing asset or create new asset.
8. If creating a new asset:

   * propose a default name,
   * propose currency from Monobank currency code,
   * propose balance from Monobank current balance,
   * create Lunch Money asset via `POST /v1/assets`,
   * store returned `asset_id`.
9. Ask for default tag:

   * default: `monobank-sync`,
   * allow per-account override.
10. Save config file.
11. Print sanitized summary.

### 6.2 Example setup UX

```text
Found Monobank accounts:

[1] Black card UAH ****1234 | balance 25,430.20 UAH
[2] White card UAH ****5678 | balance 3,200.00 UAH
[3] FOP UAH account        | balance 148,000.00 UAH
[4] EUR card ****9876      | balance 1,200.00 EUR

Track [1] Black card UAH? yes/no
> yes

Choose Lunch Money account:
[1] Monobank UAH
[2] Cash UAH
[3] Create new account
> 3

Create Lunch Money account name:
> Monobank Black UAH

Transaction tag:
> monobank-sync
```

### 6.3 Lunch Money asset creation defaults

For debit/current accounts:

```json
{
  "type_name": "cash",
  "name": "Monobank Black UAH",
  "balance": "25430.20",
  "currency": "uah",
  "institution_name": "Monobank"
}
```

For credit-like cards, use `type_name: "credit"` only if the user explicitly selects it or if Monobank account type clearly indicates credit behavior. Otherwise default to `cash` to avoid wrong semantics.

---

## 7. Sync Stage

Command:

```bash
mono-lunchmoney sync --quiet
```

The sync command must be non-interactive and safe for Windows Task Scheduler.

### 7.1 Sync flow

1. Load config.
2. Resolve tokens.
3. Validate there is at least one enabled account mapping.
4. Acquire lock file.
5. For every enabled account mapping:

   * calculate `from = now - lookbackDays`, default 31 days,
   * calculate `to = now`,
   * fetch Monobank statement window,
   * handle Monobank 500-transaction paging,
   * map Monobank transactions to Lunch Money insert objects,
   * chunk into batches of max 500,
   * insert into Lunch Money with dedupe options.
6. Release lock file.
7. Write success/failure logs.
8. Exit with code `0` on success, non-zero on failure.

### 7.2 Stateless idempotency

Do not rely on local “last imported transaction”.

For each Monobank transaction, set:

```text
external_id = mono:<monoAccountId>:<monoTransactionId>
```

If this exceeds 75 chars, create a deterministic shortened id:

```text
external_id = mono:<shortAccountHash>:<shortTransactionHash>
```

Hash algorithm can be SHA-256 hex truncated to a safe length. The result must be deterministic.

Example:

```text
mono:a1b2c3d4:9f8e7d6c5b4a
```

The important invariant:

```text
Same Monobank transaction + same Monobank account + same Lunch Money asset => same external_id every run.
```

### 7.3 Lunch Money insert request

Use:

```json
{
  "transactions": [],
  "apply_rules": false,
  "skip_duplicates": true,
  "check_for_recurring": false,
  "debit_as_negative": true,
  "skip_balance_update": true
}
```

Rationale:

* `apply_rules: false` keeps imports predictable. The user can manually categorize/review later.
* `skip_duplicates: true` adds an extra fallback dedupe by date/payee/amount.
* `debit_as_negative: true` matches Monobank signed amount semantics.
* `skip_balance_update: true` avoids changing Lunch Money account balances based on imported historical transactions.
* `status: "uncleared"` keeps transactions review-pending/non-verified.

---

## 8. Transaction Mapping

### 8.1 Monobank to Lunch Money transaction

Pseudo TypeScript:

```ts
type AccountMapping = {
  enabled: boolean;
  monoAccountId: string;
  monoDisplayName: string;
  monoCurrencyCode: number;
  currency: string;
  lunchMoneyAssetId: number;
  lunchMoneyAccountName: string;
  tag: string;
  externalIdPrefix: string;
};

type LunchMoneyInsertTransaction = {
  date: string;
  amount: string;
  currency: string;
  payee: string;
  asset_id: number;
  status: "uncleared";
  external_id: string;
  tags: string[];
  notes?: string;
};
```

Mapping function:

```ts
function mapMonoToLunchMoney(tx: MonoStatementItem, account: AccountMapping): LunchMoneyInsertTransaction {
  return {
    date: toLocalIsoDate(tx.time),
    amount: minorUnitsToDecimalString(tx.amount, account.currency),
    currency: account.currency,
    payee: buildPayee(tx),
    asset_id: account.lunchMoneyAssetId,
    status: "uncleared",
    external_id: buildExternalId(account.monoAccountId, tx.id),
    tags: [account.tag],
    notes: buildNotes(tx, account)
  };
}
```

### 8.2 Date handling

Use transaction timestamp from Monobank.

Default date format:

```text
YYYY-MM-DD
```

Implementation note:

* Prefer local date in the user’s timezone for UI consistency.
* Provide a config option later if needed:

```json
{
  "dateTimezone": "Europe/Warsaw"
}
```

### 8.3 Amount handling

Monobank amounts are returned in minor currency units for common currencies, for example UAH kopiykas.

For UAH/EUR/USD/PLN:

```ts
amount = tx.amount / 100
```

Store as decimal string:

```text
-420.50
```

Use `debit_as_negative: true` in Lunch Money insert request.

### 8.4 Payee mapping

Preferred order:

```text
tx.description
tx.counterName
tx.comment
"Monobank transaction"
```

Truncate to Lunch Money payee max length.

### 8.5 Notes mapping

Notes should be compact and fit into Lunch Money limits.

Recommended key-value format:

```text
mono_id=abc123; mono_acc=black123; mcc=5411; hold=false; receipt=xyz; balance=123456
```

Include only available fields.

Do not store full JSON in notes.

Minimum recommended fields:

```text
mono_id=<transaction id>
mono_acc=<Monobank account id or short hash>
```

Optional fields:

```text
mcc=<mcc>
hold=<true/false>
receipt=<receiptId>
invoice=<invoiceId>
balance=<balance in minor units>
operationAmount=<operationAmount>
currencyCode=<currencyCode>
commissionRate=<commissionRate>
cashbackAmount=<cashbackAmount>
```

If notes exceed 350 chars, truncate optional fields first. Never truncate `mono_id` unless it is also present in `external_id`.

---

## 9. Monobank Fetching Logic

### 9.1 Daily sync window

Default:

```text
lookbackDays = 31
```

For normal sync:

```text
from = now - 31 days
to = now
```

Because idempotency is handled by Lunch Money `external_id`, repeated overlapping imports are expected and safe.

### 9.2 Statement pagination

Pseudo-code:

```ts
async function fetchAllStatementItems(accountId: string, from: number, to: number): Promise<MonoStatementItem[]> {
  const all: MonoStatementItem[] = [];
  let currentTo = to;

  while (true) {
    const items = await monoClient.getStatement(accountId, from, currentTo);
    all.push(...items);

    if (items.length < 500) break;

    const oldestTime = Math.min(...items.map(x => x.time));
    currentTo = oldestTime - 1;

    await delay(60_000);
  }

  return dedupeByMonoId(all);
}
```

### 9.3 Rate limiting

Implement a Monobank request queue or simple limiter:

```text
minimum 60 seconds between calls to /personal/client-info
minimum 60 seconds between calls to /personal/statement/...
```

For setup this means:

* call client-info once,
* cache response during the setup run.

For sync this means:

* process configured accounts sequentially,
* wait when needed.

---

## 10. Windows Scheduler

Command:

```bash
mono-lunchmoney scheduler install --daily-at 20:00
```

### 10.1 Task behavior

Create a Windows Task Scheduler task:

```text
Task name: MonoLunchMoneySync
Run as current Windows user
Run only when user is logged on by default
Run daily at configured time
Do not start a new instance if previous sync is still running
Start when available
Allow start on battery
Do not stop if going on battery
```

Running when the user is not logged on can be a later option, because it may require stored Windows credentials.

### 10.2 Scheduled command

If packaged as executable:

```text
mono-lunchmoney.exe sync --config "%APPDATA%\mono-lunchmoney\config.json" --quiet
```

If running as Node script:

```text
node "C:\path\mono-lunchmoney\dist\cli.js" sync --config "%APPDATA%\mono-lunchmoney\config.json" --quiet
```

Do not include tokens in arguments.

### 10.3 PowerShell implementation example

The CLI may create the task by executing PowerShell:

```powershell
$TaskName = "MonoLunchMoneySync"
$AppPath = "C:\Users\USER\AppData\Local\mono-lunchmoney\mono-lunchmoney.exe"
$ConfigPath = "$env:APPDATA\mono-lunchmoney\config.json"
$LogPath = "$env:APPDATA\mono-lunchmoney\sync.log"

$Action = New-ScheduledTaskAction `
  -Execute $AppPath `
  -Argument "sync --config `"$ConfigPath`" --quiet --log `"$LogPath`""

$Trigger = New-ScheduledTaskTrigger `
  -Daily `
  -At 20:00

$Settings = New-ScheduledTaskSettingsSet `
  -MultipleInstances IgnoreNew `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Daily Monobank to Lunch Money transaction sync" `
  -Force
```

### 10.4 Scheduler status

`scheduler status` should report:

```text
Task exists: yes/no
Task name
Next run time
Last run time
Last result code
Configured command
```

Sanitize paths only if needed. Never print tokens.

---

## 11. Locking

Use a lock file to prevent overlapping imports:

```text
%APPDATA%\mono-lunchmoney\sync.lock
```

Behavior:

1. On sync start, create lock file atomically.
2. If lock exists and process is still alive, exit with a clear log message.
3. If lock exists but is stale, remove it and continue.
4. Always remove lock on normal exit.

Stale lock default:

```text
6 hours
```

Even though Lunch Money external id dedupe should prevent duplicate transaction creation, locking reduces noisy failures and API races.

---

## 12. Logging

Write logs to:

```text
%APPDATA%\mono-lunchmoney\sync.log
%APPDATA%\mono-lunchmoney\error.log
```

Example success log:

```text
[2026-05-15 20:00:01] Sync started
[2026-05-15 20:00:03] Account Monobank Black UAH: fetched 48 transactions
[2026-05-15 20:00:05] Account Monobank Black UAH: sent 48 transactions to Lunch Money
[2026-05-15 20:00:05] Account Monobank Black UAH: Lunch Money inserted 6, duplicates/ignored 42
[2026-05-15 20:00:06] Sync finished successfully
```

Example error log:

```text
[2026-05-15 20:00:04] ERROR Monobank request failed: HTTP 429 Too Many Requests
[2026-05-15 20:00:04] Sync failed
```

Log requirements:

1. Never log tokens.
2. Avoid logging full account numbers or full IBANs.
3. Mask PANs/IBANs where displayed.
4. Log transaction ids only if needed for debugging; prefer shortened ids.

---

## 13. Suggested Project Structure

```text
src/
  cli.ts
  commands/
    setup.command.ts
    sync.command.ts
    backfill.command.ts
    scheduler.command.ts
    config.command.ts
  config/
    config.model.ts
    config.loader.ts
    config.writer.ts
    paths.ts
  monobank/
    mono-client.ts
    mono-types.ts
    mono-rate-limiter.ts
    statement-fetcher.ts
    currency-map.ts
  lunchmoney/
    budget-provider.ts
    lunchmoney-v1-client.ts
    lunchmoney-types.ts
  mapping/
    mono-to-lunchmoney.mapper.ts
    external-id.ts
    notes-builder.ts
  scheduler/
    windows-task-scheduler.ts
  locking/
    lock-file.ts
  logging/
    logger.ts
  utils/
    date.ts
    money.ts
    masking.ts
```

Important abstraction:

```ts
interface BudgetProvider {
  listAccounts(): Promise<BudgetAccount[]>;
  createAccount(input: CreateBudgetAccountInput): Promise<BudgetAccount>;
  importTransactions(input: ImportTransactionsInput): Promise<ImportTransactionsResult>;
}
```

This allows later migration from Lunch Money v1 to v2.

---

## 14. Error Handling

### 14.1 Setup errors

Handle:

1. Missing `MONO_TOKEN`.
2. Missing `LUNCHMONEY_TOKEN`.
3. Invalid Monobank token.
4. Invalid Lunch Money token.
5. No Monobank accounts found.
6. No Lunch Money assets found and asset creation fails.
7. User cancels setup.
8. Config path not writable.

### 14.2 Sync errors

Handle:

1. Missing config.
2. Invalid config schema.
3. Missing tokens.
4. Monobank 429/rate limit.
5. Monobank 401/403.
6. Lunch Money 401/403.
7. Lunch Money validation errors.
8. Network timeouts.
9. Lock already held.
10. Partial account failure.

Policy:

* If one account fails, log it and continue with other accounts if safe.
* Final exit code should be non-zero if any account failed.
* Do not delete/modify Lunch Money transactions during sync.

---

## 15. Backfill Mode

Command:

```bash
mono-lunchmoney backfill --from 2025-01-01 --to 2026-05-15
```

Behavior:

1. Read config.
2. Split requested period into chunks no larger than 31 days.
3. For each enabled account and each chunk:

   * fetch statement,
   * respect rate limit,
   * import with same idempotency rules.
4. Use the same transaction mapping as normal sync.
5. Repeated backfills must be safe because `external_id` is deterministic.

Do not make backfill the default scheduled behavior.

---

## 16. Security Requirements

1. Do not store API tokens in `config.json` by default.
2. Do not pass API tokens as command-line arguments.
3. Do not log API tokens.
4. Do not log full card numbers or full IBANs.
5. Mask sensitive account identifiers in console output.
6. Config file should be created under the user profile, not system-wide.
7. Optionally set restrictive file permissions for config and logs.
8. Treat `notes` as visible financial metadata; store only compact technical data needed for debugging/idempotency.

---

## 17. Lunch Money v2 Migration Note

Initial implementation should target Lunch Money API v1.

Keep API adapter boundaries clean because v2 changes important names:

| v1                       | v2                  |
| ------------------------ | ------------------- |
| `asset_id`               | `manual_account_id` |
| `assets`                 | `manual_accounts`   |
| `tags` with strings/ids  | `tag_ids`           |
| hydrated related objects | mostly ids only     |

In v2, tag handling should create/resolve tag ids before import and then use `tag_ids`.

Do not implement v2 unless explicitly requested.

---

## 18. Acceptance Criteria

### 18.1 Setup acceptance criteria

1. Running `mono-lunchmoney setup` fetches Monobank accounts/cards.
2. Setup displays masked Monobank account/card details.
3. User can skip any Monobank account/card.
4. User can map a selected Monobank account/card to an existing Lunch Money asset.
5. User can create a new Lunch Money asset during setup.
6. Setup saves a valid config file.
7. Setup never stores plain API tokens in config.
8. Setup prints a sanitized summary of tracked mappings.

### 18.2 Sync acceptance criteria

1. Running `mono-lunchmoney sync` imports transactions for enabled mappings.
2. Every imported transaction is attached to the configured Lunch Money `asset_id`.
3. Every imported transaction has `status: "uncleared"`.
4. Every imported transaction has the configured tag.
5. Every imported transaction has a deterministic `external_id`.
6. Running sync twice does not duplicate transactions.
7. Sync works without any user prompt.
8. Sync writes readable logs.
9. Sync respects Monobank statement window limits.
10. Sync handles Monobank 500-transaction paging.
11. Sync chunks Lunch Money inserts to max 500 transactions per request.

### 18.3 Scheduler acceptance criteria

1. Running `mono-lunchmoney scheduler install --daily-at 20:00` creates a Windows Scheduled Task.
2. The scheduled task calls `sync --quiet`.
3. The scheduled task command does not contain API tokens.
4. `scheduler status` shows task existence and last/next run information.
5. `scheduler uninstall` removes the task.
6. If scheduled sync overlaps with manual sync, lock file prevents concurrent execution.

### 18.4 Backfill acceptance criteria

1. `backfill --from X --to Y` splits periods into valid Monobank windows.
2. Re-running backfill does not duplicate transactions.
3. Backfill uses the same mapping, tags, status, notes, and external id rules as normal sync.

---

## 19. Implementation Order

Recommended order for Codex:

1. Create TypeScript project skeleton.
2. Add config model, path resolver, config reader/writer.
3. Add Monobank client with `client-info` and `statement` methods.
4. Add Lunch Money v1 client with `listAssets`, `createAsset`, `insertTransactions`.
5. Add mapping functions:

   * currency code mapping,
   * amount conversion,
   * date conversion,
   * external id builder,
   * notes builder.
6. Implement `setup` command.
7. Implement `sync` command.
8. Add lock file.
9. Add logging.
10. Implement Windows scheduler install/status/uninstall.
11. Implement backfill.
12. Add tests for mapping/idempotency/config.
13. Add README with setup instructions.

---

## 20. Testing Plan

### 20.1 Unit tests

Test:

1. `buildExternalId` returns same value for same input.
2. `buildExternalId` never exceeds 75 chars.
3. Monobank minor-unit amounts convert correctly.
4. Transaction date formats as `YYYY-MM-DD`.
5. Notes builder stays under 350 chars.
6. Mapping always sets `status: "uncleared"`.
7. Mapping always includes configured tag.
8. Mapping always sets configured Lunch Money asset id.
9. Config parser rejects invalid config.

### 20.2 Integration tests with mocked APIs

Test:

1. Setup with existing Lunch Money asset.
2. Setup with new Lunch Money asset creation.
3. Sync imports a normal statement.
4. Sync handles duplicate rerun.
5. Sync handles 500-item Monobank paging.
6. Sync chunks >500 Lunch Money transactions.
7. Scheduler command generation does not include tokens.

### 20.3 Manual smoke test

1. Set `MONO_TOKEN` and `LUNCHMONEY_TOKEN`.
2. Run setup.
3. Track one Monobank card.
4. Map/create one Lunch Money account.
5. Run dry-run sync.
6. Run real sync.
7. Verify in Lunch Money:

   * transactions appear in correct account,
   * transactions are uncleared,
   * transactions have tag,
   * notes contain Monobank metadata.
8. Run sync again.
9. Verify no duplicates.
10. Install scheduler.
11. Verify scheduled task exists.

---

## 21. README Outline

The final repository should include a README with:

1. What the tool does.
2. What it does not do.
3. Requirements:

   * Node.js version,
   * Monobank personal API token,
   * Lunch Money developer token.
4. Installation.
5. Environment variable setup on Windows.
6. Running setup.
7. Running sync manually.
8. Installing Windows scheduler.
9. Backfill usage.
10. Troubleshooting.
11. Security notes.
12. API limitations.

---

## 22. Important Defaults

Use these defaults unless the user config says otherwise:

```json
{
  "lookbackDays": 31,
  "defaultTag": "monobank-sync",
  "transactionStatus": "uncleared",
  "applyRules": false,
  "skipDuplicates": true,
  "debitAsNegative": true,
  "skipBalanceUpdate": true,
  "schedulerDailyAt": "20:00",
  "schedulerTaskName": "MonoLunchMoneySync"
}
```

---

## 23. Out of Scope for First Version

Do not implement in v1 unless explicitly requested:

1. Hosted server.
2. Monobank webhooks.
3. Real-time sync.
4. GUI.
5. Local database.
6. Automatic categorization beyond Lunch Money manual review.
7. Automatic transaction deletion/update reconciliation.
8. Multi-user SaaS flow.
9. Lunch Money v2 migration.
10. Crypto/stock price sync.

---

## 24. Final Target Behavior

After implementation, the expected user flow is:

```bash
setx MONO_TOKEN "..."
setx LUNCHMONEY_TOKEN "..."

mono-lunchmoney setup
mono-lunchmoney sync
mono-lunchmoney scheduler install --daily-at 20:00
```

Then Windows runs the background sync daily.

Every run:

```text
Fetch selected Monobank account statements for the last 31 days
Map transactions to Lunch Money manual accounts
Insert them as uncleared
Tag them as monobank-sync or configured tag
Set deterministic external_id
Store compact Mono metadata in notes
Skip duplicates safely through Lunch Money external_id dedupe
Exit
```

The result is a local, stateless, Windows-friendly Monobank → Lunch Money bridge suitable for personal budget tracking without relying on bank aggregators or a permanently running server.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read:

`specs/006-hidden-scheduled-sync/plan.md`
<!-- SPECKIT END -->
