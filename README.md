# Mono Lunch Money

Local Windows-friendly CLI for importing selected Monobank card/account
transactions into Lunch Money manual accounts. The tool is stateless for
transaction progress: it stores mappings and settings only, and relies on Lunch
Money `external_id` dedupe for safe reruns.

## What It Does

- Runs interactive `mono-lunchmoney setup` to select Monobank sources and map or
  create Lunch Money manual accounts.
- Lets setup mark Monobank sources as ignored transfer sources, so internal
  transfers from those accounts can be skipped on imported accounts.
- Guides API token setup interactively, including token links and protected
  user-scoped storage for future sync/scheduler runs.
- Runs non-interactive `mono-lunchmoney sync` for recent transactions.
- Imports transactions as `status: "uncleared"` with deterministic
  `external_id`, configured tags, compact Monobank notes, and mapped `asset_id`.
- Supports duplicate-safe `backfill --from --to` using provider-safe windows.
- Installs a Windows Task Scheduler job that calls quiet sync through a hidden
  background launcher without tokens in the command line.
- Can show Windows desktop notifications for scheduled or quiet sync/backfill
  failures, partial failures, lock-held exits, and explicit success opt-in.
- Writes sanitized config and logs under `%APPDATA%\mono-lunchmoney` by default.

## What It Does Not Do

- No hosted server, daemon, GUI, webhooks, or local transaction database.
- No automatic category reconciliation or transaction deletion/update.
- Lunch Money API v2 is intentionally not implemented in this version.
- Email, mobile push, and non-Windows desktop notifications are not implemented.

## Requirements

- Node.js `>=20.19.0`.
- Monobank personal API token. Setup links to `https://api.monobank.ua/`.
- Lunch Money developer token. Setup links to `https://my.lunchmoney.app/developers`
  and API docs at `https://lunchmoney.dev/`.
- Windows is required for scheduler install/status/uninstall.
- Protected credential reuse is currently Windows-focused and scoped to the
  Windows user that saved the tokens.

## Install

```powershell
npm install
npm run build
npm install -g .
mono-lunchmoney help
```

## Usage

First-time setup:

```powershell
mono-lunchmoney setup
```

Setup handles the full onboarding flow:

- shows where to obtain Monobank and Lunch Money API tokens;
- prompts for missing tokens;
- validates both providers;
- saves validated tokens to protected user-scoped storage by default, unless
  you choose setup-only temporary use;
- displays Monobank accounts/cards;
- maps each tracked card/account to an existing Lunch Money manual account or
  creates a new one;
- separately asks whether each source should be used to ignore related transfer
  transactions;
- optionally installs the daily Windows scheduled sync task.

Credential management:

```powershell
mono-lunchmoney credentials status
mono-lunchmoney credentials set --provider monobank
mono-lunchmoney credentials set --provider lunchmoney
mono-lunchmoney credentials remove --provider all --yes
```

Existing `MONO_TOKEN` and `LUNCHMONEY_TOKEN` environment values are still read
as compatibility input when protected credentials are missing. Setup can migrate
those values into protected storage. Token values are not accepted as CLI
options.

Manual sync:

```powershell
mono-lunchmoney sync --config "$env:APPDATA\mono-lunchmoney\config.json"
mono-lunchmoney sync --dry-run
mono-lunchmoney sync --lookback-days 31
```

During `setup`, you can enter an optional baseline date in common formats such
as `2026-05-01`, `01.05.2026`, `May 1 2026`, `today`, or `yesterday`. The value
is saved as `YYYY-MM-DD`. When `baselineDate` is set in config, sync and
backfill clamp Monobank statement requests so no transactions before that date
are fetched.

Setup also asks whether to enable Windows notifications. Notifications default
to disabled. If enabled, sync/backfill start, failure, partial-failure, and
lock-held notifications are enabled by default; success notifications require
explicit opt-in.

Ignored transfer sources:

```text
Track WHITE UAH ****2222 for Lunch Money import? no
Ignore transfers involving WHITE UAH ****2222? yes
```

Use this when a Monobank account/card should not be imported but transfers from
it into an imported card should also stay out of Lunch Money. The ignored list
is saved separately from Lunch Money mappings. Sync and backfill skip only
transactions that confidently match an ignored source, such as by counterparty
IBAN hash or masked card suffix; ambiguous transfers remain eligible for import.
Skipped counts are logged without full account identifiers.

Backfill:

```powershell
mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15
```

Config inspection:

```powershell
mono-lunchmoney config show
mono-lunchmoney config notifications status
mono-lunchmoney config notifications enable
mono-lunchmoney config notifications enable --success
mono-lunchmoney config notifications disable
```

Notification settings are saved in config as static preferences only. The app
does not store notification history, transaction cursors, or last sync state.

Scheduler lifecycle:

```powershell
mono-lunchmoney scheduler install --daily-at 20:00 --config "$env:APPDATA\mono-lunchmoney\config.json"
mono-lunchmoney scheduler status
mono-lunchmoney scheduler uninstall
```

You can also choose to install the scheduled task at the end of
`mono-lunchmoney setup`.

The scheduled command has this shape:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

Task Scheduler registers a short consoleless launcher action and
`scheduler status` shows the concise sync command above plus
`Mode: hidden background`. Scheduled or manually started task runs should not
open a terminal, command prompt, PowerShell window, empty console, or prompt.
The only user-visible UI from scheduled sync is whatever the saved notification
settings allow.

API tokens are never included in the scheduled command, launcher file, or status
output. Credentials come from protected user-scoped storage when the task runs
as the same Windows user that completed setup. Existing environment variables
remain a compatibility source when protected credentials are missing.

Scheduled sync uses the notification preferences saved in config at runtime.
The scheduled command does not need notification flags.

## Runtime Files

Default Windows paths:

```text
%APPDATA%\mono-lunchmoney\config.json
%APPDATA%\mono-lunchmoney\sync.log
%APPDATA%\mono-lunchmoney\error.log
%APPDATA%\mono-lunchmoney\sync.lock
%APPDATA%\mono-lunchmoney\credentials\*.credential.json
```

Use `--config "C:\path\config.json"` to override the config path for setup,
sync, backfill, and scheduler install.

## Troubleshooting

- `mono-lunchmoney config show` prints sanitized mappings and runtime paths.
- `mono-lunchmoney config show` also prints ignored transfer sources with
  masked identifiers and matcher availability.
- `%APPDATA%\mono-lunchmoney\sync.log` contains success summaries.
- `%APPDATA%\mono-lunchmoney\error.log` contains sanitized failure records.
- `mono-lunchmoney scheduler status` shows task existence, last/next run, result
  code, hidden mode, and the underlying sync command instead of long launcher
  internals.
- If a scheduled task still opens a terminal, reinstall it with
  `mono-lunchmoney scheduler install --daily-at <HH:mm>` so the previous visible
  action is replaced.
- `mono-lunchmoney credentials status` shows whether Monobank and Lunch Money
  credentials are available without printing token values.
- If sync/backfill reports missing credentials, run `mono-lunchmoney setup` or
  `mono-lunchmoney credentials set`.
- If Windows notifications are enabled and a quiet sync/backfill fails, exits
  with partial account failures, or finds an existing lock, the CLI requests a
  sanitized Windows notification and keeps the original command exit outcome.
- If notification delivery itself fails, the delivery problem is logged in
  `error.log` and does not mask the sync/backfill result.

## Security Notes

- Do not pass `MONO_TOKEN` or `LUNCHMONEY_TOKEN` as CLI arguments.
- Do not put API tokens into scheduled task commands.
- Prefer entering tokens through `mono-lunchmoney setup`; setup does not write
  them into `config.json`.
- Saved provider tokens are stored in protected user-scoped credential records,
  not as plain config or log values. If protected storage is unavailable, the CLI
  fails closed instead of writing a plaintext fallback.
- Environment variables are supported for compatibility and migration, but they
  are not the preferred persistent storage.
- `config show`, scheduler status, setup summaries, and logs sanitize token-like
  values, PANs, IBANs, and long account identifiers.
- Ignored transfer source config stores masked PANs and IBAN hashes only. It
  does not store full IBANs, full PANs, or any per-transaction ignore state.
- Config stores static or semi-static settings only. It must not store imported
  transaction progress such as cursors, last transaction ids, or last sync time.
- `baselineDate` is a static import boundary, not sync progress. Changing it is
  safe because idempotency still comes from Lunch Money `external_id` values.
- Notification bodies are sanitized before delivery and before diagnostic
  logging. Token-like values, PANs, IBANs, and long identifiers are masked.
