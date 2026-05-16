# Quickstart: Windows Notifications

## Prerequisites

- Existing Monobank to Lunch Money sync configuration.
- Windows for real notification smoke testing.
- Non-Windows development may validate skipped delivery behavior with tests.

## Enable Notifications During Setup

```powershell
mono-lunchmoney setup
```

Expected setup behavior:

- Setup asks whether Windows notifications should be enabled.
- Notifications default to disabled.
- If enabled, setup asks whether successful sync completion should notify.
- Setup accepts friendly baseline date input and stores it as `YYYY-MM-DD`.
- The saved config contains notification settings but no tokens.

## Enable Or Disable Later

```powershell
mono-lunchmoney config notifications enable
mono-lunchmoney config notifications enable --success
mono-lunchmoney config notifications disable
mono-lunchmoney config notifications status
```

Expected result:

- Commands run without prompts.
- Existing account mappings and scheduler settings are preserved.
- `config show` and notification status display sanitized settings.

Example status output:

```text
Notification settings
Notifications enabled: yes
Notify on success: no
Notify on failure: yes
Notify on partial failure: yes
Notify on lock held: yes
```

## Manual Sync Smoke Test

Failure notification path:

```powershell
mono-lunchmoney config notifications enable
mono-lunchmoney sync --config "$env:APPDATA\mono-lunchmoney\config.json" --quiet
```

Expected result when sync fails:

- A Windows notification is requested.
- The notification summary is sanitized.
- The original sync exit code still reflects the sync failure.
- `error.log` contains the original sanitized sync failure and any sanitized
  notification delivery diagnostics.

Success notification path:

```powershell
mono-lunchmoney config notifications enable --success
mono-lunchmoney sync --quiet
```

Expected result when sync succeeds:

- A success notification is requested only when `--success` was used or success
  notifications were otherwise enabled.
- With failure-only settings, successful sync does not notify.

## Scheduler Smoke Test

```powershell
mono-lunchmoney scheduler install --daily-at 20:00
mono-lunchmoney scheduler status
```

Expected result:

- The scheduled command remains `sync --config "<configPath>" --quiet`.
- The scheduled command contains no notification flags and no API tokens.
- Scheduled sync uses saved notification settings at runtime.

## Verification Checklist

Run before considering the feature complete:

```powershell
npm run build
npm test
npm run lint
```

Required behavioral checks:

- Notification config defaults to disabled.
- Disabled notifications request no delivery.
- Enabled failure and partial-failure events request delivery.
- Success notifications require explicit opt-in.
- Lock-held outcome can request a notification.
- Notification messages are sanitized.
- Notification delivery failure is logged and does not alter sync/backfill exit
  outcome.
- Non-Windows delivery is skipped without failing sync/backfill.

## Verification Notes

Validated on 2026-05-16:

```powershell
npm run build
npm test
npm run lint
```

All commands completed with exit code `0`. The local PowerShell npm shim printed
an access warning while probing an unrelated user npm path, but the npm commands
continued and passed.
