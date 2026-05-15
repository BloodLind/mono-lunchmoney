# Mono Lunch Money

Local Windows-friendly CLI for syncing selected Monobank transactions into
Lunch Money manual accounts. The first implementation slice initializes the
installable CLI, runtime paths, scheduler shell, sanitized logging, and packaging
workflow.

## What It Does

- Installs a `mono-lunchmoney` command through the Node package ecosystem.
- Exposes `setup`, `sync`, `backfill`, `scheduler`, `config`, and detailed
  `help` command groups.
- Resolves config and logs under `%APPDATA%\mono-lunchmoney` by default.
- Registers a daily Windows Task Scheduler job that calls quiet sync.
- Keeps API tokens out of command-line arguments, logs, and config display.

## What It Does Not Do Yet

- This initialization slice does not import transactions.
- Active desktop, email, or push notifications for background failures are a
  separate follow-up feature.
- Hosted servers, daemons, GUIs, webhooks, and local transaction databases are
  out of scope.

## Requirements

- Node.js active LTS. The package currently requires Node.js `>=20.19.0`.
- Windows is required for scheduler install/status/uninstall behavior.
- Future sync features will require `MONO_TOKEN` and `LUNCHMONEY_TOKEN` from
  user-level environment variables or secure user storage.

## Install

For using this checkout as a global CLI:

```powershell
npm install
npm run build
npm install -g .
mono-lunchmoney help
```

For local development with a live link:

```powershell
npm install
npm run build
npm link
mono-lunchmoney help
```

For validating a packaged tarball before release:

```powershell
npm run build
npm pack
npm install -g .\mono-lunchmoney-0.1.0.tgz
mono-lunchmoney help
```

After the package is published to npm:

```powershell
npm install -g mono-lunchmoney
mono-lunchmoney help
```

Set `NO_COLOR=1` if you need plain, uncolored terminal output.

## Commands

```powershell
mono-lunchmoney --help
mono-lunchmoney help
mono-lunchmoney help scheduler
mono-lunchmoney --version
mono-lunchmoney setup
mono-lunchmoney sync --config "$env:APPDATA\mono-lunchmoney\config.json" --quiet
mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15
mono-lunchmoney config show
mono-lunchmoney scheduler install --daily-at 20:00
mono-lunchmoney scheduler status
mono-lunchmoney scheduler uninstall
```

The setup, sync, and backfill commands are command shells in this feature slice.
They are discoverable and return clear not-yet-implemented or missing-config
messages until the sync feature is implemented.

## Runtime Files

Default Windows paths:

```text
%APPDATA%\mono-lunchmoney\config.json
%APPDATA%\mono-lunchmoney\sync.log
%APPDATA%\mono-lunchmoney\error.log
%APPDATA%\mono-lunchmoney\sync.lock
```

Use `--config "C:\path\config.json"` to override the config path for a command
or scheduled job. Logs and locks still default to the user profile location.

## Scheduler

Install the daily background job:

```powershell
mono-lunchmoney scheduler install --daily-at 20:00 --config "$env:APPDATA\mono-lunchmoney\config.json"
```

The registered command has this shape:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

API tokens are never included in the scheduled command. Credentials must come
from environment variables or secure storage in later sync features.

Inspect or remove the job:

```powershell
mono-lunchmoney scheduler status
mono-lunchmoney scheduler uninstall
```

## Background Failures

Background failures are discoverable through:

- `mono-lunchmoney scheduler status`
- `%APPDATA%\mono-lunchmoney\error.log`

Active notifications for background issues and exceptions are intentionally a
separate follow-up feature. This slice only ensures the status and log surfaces
preserve enough sanitized failure information for that future work.

## Package Validation

Maintainers can validate package contents before publishing:

```powershell
npm run build
npm run validate:package
npm pack
```

The package must not include local config files, logs, locks, `.env` files, or
API tokens.

## Security Notes

- Do not pass `MONO_TOKEN` or `LUNCHMONEY_TOKEN` as CLI arguments.
- Do not put API tokens into scheduled task commands.
- `config show`, scheduler status, and logs sanitize token-like values and
  sensitive financial identifiers.
- This project stores static or semi-static config only; imported transaction
  state must not be stored locally.
