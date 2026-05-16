# Quickstart: Secure Token Storage

## Prerequisites

- Node.js `>=20.19.0`.
- A Monobank personal API token.
- A Lunch Money developer token.
- Windows user profile for protected credential reuse with scheduled sync.

## First-Time Secure Setup

```powershell
mono-lunchmoney setup
```

Expected behavior:

- Setup shows where to obtain provider tokens.
- Setup accepts token input without requiring command-line token arguments.
- Setup validates both providers.
- Setup saves valid tokens to protected user-scoped storage.
- Setup writes account mappings and preferences to config without full token values.

Verify sanitized config:

```powershell
mono-lunchmoney config show
```

Expected result:

- Config path, mappings, scheduler settings, and notification settings may appear.
- Credential record presence may appear as `saved` or `not saved`.
- Full Monobank and Lunch Money token values do not appear.

## Check Credential Status

```powershell
mono-lunchmoney credentials status
```

Expected result:

```text
Credential Status
=================

  Monobank:     ready (protected storage)
  Lunch Money:  ready (protected storage)
```

No token values should be printed.

## Reuse Credentials Non-Interactively

```powershell
mono-lunchmoney sync --dry-run --quiet
mono-lunchmoney backfill --from 2026-01-01 --to 2026-01-31 --dry-run --quiet
```

Expected result:

- Commands do not prompt for tokens.
- Commands resolve credentials from protected storage.
- Missing or inaccessible credentials produce a clear non-zero error.

## Scheduler Verification

```powershell
mono-lunchmoney scheduler install --daily-at 20:00
mono-lunchmoney scheduler status
```

Expected result:

- Registered command calls `sync --config "<configPath>" --quiet`.
- Registered command contains no tokens.
- Scheduled sync can reuse credentials when it runs as the same user that completed setup.

## Rotate Credentials

```powershell
mono-lunchmoney credentials set --provider monobank
mono-lunchmoney credentials set --provider lunchmoney
```

Expected result:

- CLI prompts for replacement token values.
- Replacement is validated before it becomes the reusable credential.
- Old token is no longer used after successful replacement.

## Remove Credentials

```powershell
mono-lunchmoney credentials remove --provider all --yes
mono-lunchmoney credentials status
```

Expected result:

- Protected credentials are removed.
- Account mappings remain intact.
- Future non-interactive sync/backfill fails clearly until setup or credential set is run again.

## Manual Security Checks

- Search config and log files for known token values; no full token should appear.
- Check scheduler status and Windows Task Scheduler action; no token should appear.
- Confirm copied app runtime files are not sufficient to recover usable credentials.
- Confirm notifications and errors do not include full token values.
