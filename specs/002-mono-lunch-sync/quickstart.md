# Quickstart: Monobank to Lunch Money Sync

## Prerequisites

- Node.js `>=20.19.0`.
- Monobank personal API token from `https://api.monobank.ua/`.
- Lunch Money developer token from `https://my.lunchmoney.app/developers`.
- Windows for scheduler install/status/uninstall smoke tests.

## Development Setup

```powershell
npm install
npm run build
npm test
```

For local CLI testing from the checkout:

```powershell
npm link
mono-lunchmoney --help
```

## First-Time Setup

```powershell
mono-lunchmoney setup
```

Setup shows token links, prompts for missing tokens, validates both providers,
and can save entered tokens to the Windows user environment for future sync and
scheduler runs. Do not pass either token as a command-line option.

Expected output shape:

```text
API token setup
Monobank token: open https://api.monobank.ua/ and create/copy your personal API token.
Lunch Money token: open https://my.lunchmoney.app/developers in the app and create/copy a developer API token.
Connecting to Monobank...
Connecting to Lunch Money...
Found Monobank accounts/cards:
[1] BLACK UAH 4444******1111 | balance 25430.20 UAH
Config saved: C:\Users\<you>\AppData\Roaming\mono-lunchmoney\config.json
Tracked mappings:
- BLACK UAH 4444...1111 -> Monobank Black UAH (mono:m...nt-1)
```

Expected result:

- Monobank sources are displayed with masked identifiers.
- Each tracked source is mapped to an existing or newly created Lunch Money
  manual account.
- An optional baseline date can be entered in common formats such as
  `2026-05-01`, `01.05.2026`, `May 1 2026`, `today`, or `yesterday`. It is saved
  as `baselineDate` in `YYYY-MM-DD`; sync and backfill will not fetch Monobank
  statements before this date.
- `%APPDATA%\mono-lunchmoney\config.json` is written without API tokens.
- The final summary contains only sanitized identifiers.

## Manual Sync

```powershell
mono-lunchmoney sync --config "$env:APPDATA\mono-lunchmoney\config.json"
```

For a preview without writing to Lunch Money:

```powershell
mono-lunchmoney sync --dry-run
```

Expected result:

- Enabled mappings are processed without prompts.
- Imported transactions are `uncleared`, tagged, assigned to the mapped
  `asset_id`, and include compact Monobank notes.
- Re-running sync against the same transactions creates no duplicates.
- Logs are written to `%APPDATA%\mono-lunchmoney\sync.log` and
  `%APPDATA%\mono-lunchmoney\error.log`.

Example sync log:

```text
[2026-05-15 20:00:01] Sync started
[2026-05-15 20:00:03] Account Monobank Black UAH: fetched 48 transactions
[2026-05-15 20:00:05] Account Monobank Black UAH: sent 48 transactions to Lunch Money
[2026-05-15 20:00:06] Sync finished successfully
```

## Backfill

```powershell
mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15
```

Expected result:

- The range is split into provider-safe windows.
- The same mapping, tags, notes, status, and `external_id` logic as sync are
  used.
- Re-running the same backfill is duplicate-safe.

## Scheduler

Install daily sync:

```powershell
mono-lunchmoney scheduler install --daily-at 20:00 --config "$env:APPDATA\mono-lunchmoney\config.json"
```

Inspect status:

```powershell
mono-lunchmoney scheduler status
```

Uninstall:

```powershell
mono-lunchmoney scheduler uninstall
```

The registered command must have this shape and must not contain tokens:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

## Configuration Display

```powershell
mono-lunchmoney config show
```

Expected result:

- Shows config/log/lock paths and mappings.
- Does not show API tokens, full PANs, full IBANs, or full account numbers.

## Verification Checklist

Run before considering the feature complete:

```powershell
npm run build
npm test
npm run lint
```

Required behavioral checks:

- Unit tests cover external id stability and length.
- Unit tests cover amount/date/payee/notes mapping.
- Unit tests cover config validation and sanitized config display.
- Mocked integration tests cover setup with existing and new Lunch Money assets.
- Mocked integration tests cover sync duplicate reruns.
- Mocked integration tests cover Monobank 500-item paging.
- Mocked integration tests cover Lunch Money chunking above 500 transactions.
- Scheduler tests prove registered commands contain no tokens.

## Implementation Validation Notes

- 2026-05-16 validation from the repository root passed:
  `npm run build`, `npm test`, and `npm run lint`, with `NODE_OPTIONS` cleared
  because the local shell had a stale VS Code debug preload.
- The local npm PowerShell shim printed an access-denied warning while still
  returning successful exit codes for passing build/lint/test commands.
- Config writes and sync orchestration were reviewed to confirm they do not
  persist imported transaction progress.
