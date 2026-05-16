# Quickstart: Node CLI Project Initialization

This quickstart validates the initialization feature: installable CLI command,
runtime paths, scheduler shell, sanitized status/log behavior, and documentation.

## Prerequisites

- Windows for scheduler install/status/uninstall validation.
- Node.js active LTS installed.
- A terminal opened after installation so PATH changes are visible.

## Install For Local Validation

```powershell
npm install
npm run build
npm link
mono-lunchmoney --help
mono-lunchmoney help
```

Expected result: concise help output lists `setup`, `sync`, `backfill`,
`scheduler`, `config`, and `help` commands. Detailed help must not require
credentials or a config file.

## Validate Runtime Paths

```powershell
mono-lunchmoney config show
```

Expected result when no config exists:

- Shows the default config path under `%APPDATA%\mono-lunchmoney\config.json`.
- Explains that setup is required before real sync.
- Prints no API tokens.
- Creates no imported transaction state.

## Validate Scheduler Status Before Install

```powershell
mono-lunchmoney scheduler status
```

Expected result:

- Reports whether `MonoLunchMoneySync` exists.
- If missing, exits successfully with "not installed" style status.
- Prints no API tokens.

## Validate Scheduler Install

Use a harmless test config path if setup is not implemented yet:

```powershell
mono-lunchmoney scheduler install --daily-at 20:00 --config "$env:APPDATA\mono-lunchmoney\config.json"
mono-lunchmoney scheduler status
```

Expected result:

- A daily Windows scheduled task exists.
- The registered command invokes `mono-lunchmoney sync --quiet`.
- The registered command includes the config path.
- The registered command contains zero API tokens.

## Validate Scheduler Uninstall

```powershell
mono-lunchmoney scheduler uninstall
mono-lunchmoney scheduler status
```

Expected result:

- The scheduled task is removed.
- Status reports that it does not exist.
- No prompt is required.

## Validate Background Failure Visibility

Force a failure by pointing the scheduled command or manual quiet sync at a
missing config path:

```powershell
mono-lunchmoney sync --quiet --config "$env:TEMP\missing-mono-lunchmoney-config.json"
mono-lunchmoney scheduler status
```

Expected result:

- The command returns non-zero.
- The error log contains a readable sanitized failure.
- Scheduler status can surface a non-success last result after scheduled runs.
- No desktop/email/push notification is expected for this missing-config check.

## Package Validation

```powershell
npm pack
```

Expected result:

- The package contains built CLI output, package metadata, README, and license
  material.
- The package does not contain local config, logs, lock files, or API tokens.

## Validation Results

Validated on 2026-05-16 with Node.js v24.15.0:

- `npm run lint` passed.
- `npm run check` passed, including build, 31 Vitest tests, and package
  validation.
- `node dist\cli.js --help` listed setup, sync, backfill, scheduler, and config
  commands.
- `node dist\cli.js config show` printed user-profile runtime paths with no
  config required.
- `node dist\cli.js scheduler status` reported missing `MonoLunchMoneySync` as
  a successful status result.

## Security Checks

Run these checks before considering the feature complete:

- No command accepts `--mono-token`, `--lunchmoney-token`, or similar token
  arguments.
- Scheduler registered command contains no token-like values.
- `config show`, scheduler status, and logs mask sensitive identifiers.
- Runtime files are created under the current user's profile by default.
