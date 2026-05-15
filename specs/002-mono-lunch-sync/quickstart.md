# Quickstart: Monobank to Lunch Money Sync

## Prerequisites

- Node.js `>=20.19.0`.
- Monobank personal API token in `MONO_TOKEN`.
- Lunch Money developer token in `LUNCHMONEY_TOKEN`.
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

## Environment Variables

```powershell
setx MONO_TOKEN "<your-monobank-token>"
setx LUNCHMONEY_TOKEN "<your-lunchmoney-token>"
```

Open a new terminal after `setx` so the variables are available to the CLI.
Do not pass either token as a command-line option.

## First-Time Setup

```powershell
mono-lunchmoney setup
```

Expected result:

- Monobank sources are displayed with masked identifiers.
- Each tracked source is mapped to an existing or newly created Lunch Money
  manual account.
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
