# Mono Lunch Money

> This entire application was made with one finger on my foot and mostly delivered by Codex Agent. It was tested somehow, but I trust neither myself nor Codex. If you want to make changes to this project and plan to use agents, please refer to the Spec Kit (Specify) structure.

Local Windows-friendly CLI for syncing selected Monobank card/account transactions into Lunch Money manual accounts.

The app is stateless for transaction progress. It stores config, mappings, scheduler settings, and credentials metadata, but not imported transaction cursors. Duplicate safety relies on deterministic Lunch Money `external_id` values.

## Features

- Interactive setup for Monobank tokens, Lunch Money tokens, account selection, and mappings.
- Protected user-scoped token storage; tokens are not saved in `config.json`.
- Manual `sync` and historical `backfill`.
- Optional baseline date to avoid fetching older transactions.
- Ignored Monobank accounts for transfer-related transactions.
- Windows notifications for sync/backfill starts and outcomes.
- Hidden Windows Task Scheduler job for daily background sync.

## Requirements

- Node.js `>=20.19.0`
- Windows for scheduler and protected credential storage
- Monobank personal API token: `https://api.monobank.ua/`
- Lunch Money developer token: `https://my.lunchmoney.app/developers`

## Install

Install the published CLI globally from npm. This is the normal installation path:

```powershell
npm install -g mono-lunchmoney
```

Then confirm the command is available:

```powershell
mono-lunchmoney help
```

Install directly from a local source checkout:

```powershell
npm install
npm run build
npm install -g .
```

Install from a locally built npm package tarball:

```powershell
npm install
npm run build
$package = npm pack --silent
npm install -g ".\$package"
```

## First Run

```powershell
mono-lunchmoney setup
```

Setup will:

- show token links;
- validate Monobank and Lunch Money access;
- save tokens to protected storage if you allow it;
- let you choose tracked Monobank accounts/cards;
- map them to Lunch Money manual accounts or create new ones;
- configure ignored transfer sources, baseline date, notifications, and scheduler.

## Common Commands

```powershell
mono-lunchmoney help
mono-lunchmoney sync
mono-lunchmoney sync --dry-run
mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15

mono-lunchmoney config show
mono-lunchmoney config notifications enable
mono-lunchmoney config notifications enable --success
mono-lunchmoney config notifications disable
mono-lunchmoney config notifications status
mono-lunchmoney credentials status

mono-lunchmoney scheduler install --daily-at 20:00
mono-lunchmoney scheduler status
mono-lunchmoney scheduler uninstall
```

## Runtime Files

Default Windows locations:

```text
%APPDATA%\mono-lunchmoney\config.json
%APPDATA%\mono-lunchmoney\sync.log
%APPDATA%\mono-lunchmoney\error.log
%APPDATA%\mono-lunchmoney\sync.lock
%APPDATA%\mono-lunchmoney\credentials\*.credential.json
```

Use `--config "C:\path\config.json"` to override the config path.

## Notes

- Do not pass API tokens as CLI arguments.
- API tokens are never included in the scheduled command.
- Imported transactions are created as `uncleared`.
- New imports update the mapped Lunch Money manual account balance by default. Set
  `"skipBalanceUpdate": true` in `config.json` to keep balances unchanged during imports.
- Sync/backfill are safe to rerun because `external_id` is deterministic.
- Lunch Money API v1 is used.
- Windows desktop notifications are supported for start, failure, and success events.
- Email, mobile push, and non-Windows desktop notifications are not implemented.
- No server, daemon, GUI, webhook listener, or local transaction database.

## Agent Work

Specs, plans, and task breakdowns live under `specs/` and `.specify/`. If you use coding agents on this project, start there and keep the Spec Kit flow in sync with code changes.
