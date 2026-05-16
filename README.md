# Mono Lunch Money

Local Windows-friendly CLI for importing selected Monobank card/account
transactions into Lunch Money manual accounts. The tool is stateless for
transaction progress: it stores mappings and settings only, and relies on Lunch
Money `external_id` dedupe for safe reruns.

## What It Does

- Runs interactive `mono-lunchmoney setup` to select Monobank sources and map or
  create Lunch Money manual accounts.
- Runs non-interactive `mono-lunchmoney sync` for recent transactions.
- Imports transactions as `status: "uncleared"` with deterministic
  `external_id`, configured tags, compact Monobank notes, and mapped `asset_id`.
- Supports duplicate-safe `backfill --from --to` using provider-safe windows.
- Installs a Windows Task Scheduler job that calls quiet sync without tokens in
  the command line.
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
- Monobank personal API token in `MONO_TOKEN`.
- Lunch Money developer token in `LUNCHMONEY_TOKEN`.
- Windows is required for scheduler install/status/uninstall.

Set tokens in PowerShell:

```powershell
setx MONO_TOKEN "<your-monobank-token>"
setx LUNCHMONEY_TOKEN "<your-lunchmoney-token>"
```

Open a new terminal after `setx`.

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

Manual sync:

```powershell
mono-lunchmoney sync --config "$env:APPDATA\mono-lunchmoney\config.json"
mono-lunchmoney sync --dry-run
mono-lunchmoney sync --lookback-days 31
```

During `setup`, you can enter an optional baseline date in `YYYY-MM-DD` format.
When `baselineDate` is set in config, sync and backfill clamp Monobank statement
requests so no transactions before that date are fetched.

Setup also asks whether to enable Windows notifications. Notifications default
to disabled. If enabled, failure, partial-failure, and lock-held notifications
are enabled by default; success notifications require explicit opt-in.

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

The scheduled command has this shape:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

API tokens are never included in the scheduled command. Credentials must come
from environment variables or future secure storage.

Scheduled sync uses the notification preferences saved in config at runtime.
The scheduled command does not need notification flags.

## Runtime Files

Default Windows paths:

```text
%APPDATA%\mono-lunchmoney\config.json
%APPDATA%\mono-lunchmoney\sync.log
%APPDATA%\mono-lunchmoney\error.log
%APPDATA%\mono-lunchmoney\sync.lock
```

Use `--config "C:\path\config.json"` to override the config path for setup,
sync, backfill, and scheduler install.

## Troubleshooting

- `mono-lunchmoney config show` prints sanitized mappings and runtime paths.
- `%APPDATA%\mono-lunchmoney\sync.log` contains success summaries.
- `%APPDATA%\mono-lunchmoney\error.log` contains sanitized failure records.
- `mono-lunchmoney scheduler status` shows task existence, last/next run, result
  code, and the registered command.
- If Windows notifications are enabled and a quiet sync/backfill fails, exits
  with partial account failures, or finds an existing lock, the CLI requests a
  sanitized Windows notification and keeps the original command exit outcome.
- If notification delivery itself fails, the delivery problem is logged in
  `error.log` and does not mask the sync/backfill result.

## Security Notes

- Do not pass `MONO_TOKEN` or `LUNCHMONEY_TOKEN` as CLI arguments.
- Do not put API tokens into scheduled task commands.
- `config show`, scheduler status, setup summaries, and logs sanitize token-like
  values, PANs, IBANs, and long account identifiers.
- Config stores static or semi-static settings only. It must not store imported
  transaction progress such as cursors, last transaction ids, or last sync time.
- `baselineDate` is a static import boundary, not sync progress. Changing it is
  safe because idempotency still comes from Lunch Money `external_id` values.
- Notification bodies are sanitized before delivery and before diagnostic
  logging. Token-like values, PANs, IBANs, and long identifiers are masked.
