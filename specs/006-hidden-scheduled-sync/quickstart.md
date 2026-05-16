# Quickstart: Hidden Scheduled Sync

## Prerequisites

- Existing config from `mono-lunchmoney setup`.
- Saved credentials available to the same Windows user that runs the scheduled task.
- Windows notifications configured as desired.

## Install Or Replace Scheduler

```powershell
mono-lunchmoney scheduler install --daily-at 20:00
```

Expected result:

- Existing task with the same name is replaced.
- Output shows the concise sync command and hidden background mode.
- The registered task action is short and token-free.
- Reinstalling over an older visible-console task replaces the old action.
- If the hidden launcher cannot be prepared, install fails instead of creating a
  visible-console fallback.

## Verify Status

```powershell
mono-lunchmoney scheduler status
```

Expected result:

- Task exists is `yes`.
- Command is shown as `mono-lunchmoney sync --config "<configPath>" --quiet`.
- Mode is shown as `hidden background`.
- Status does not show API tokens or long launcher internals.

## Manual Hidden Run Check

From Windows Task Scheduler, manually start `MonoLunchMoneySync`.

Expected result:

- No terminal, console, command prompt, empty window, or prompt appears.
- If notifications are disabled, nothing visible appears.
- If notifications are enabled, only configured notifications may appear.
- `%APPDATA%\mono-lunchmoney\sync.log` or `error.log` records the run.
- Task Scheduler last result reflects sync outcome.

If a terminal appears, reinstall the scheduler with the same command from the
install section and repeat the manual start check.

## Behavioral Equivalence Check

Run:

```powershell
mono-lunchmoney sync --config "$env:APPDATA\mono-lunchmoney\config.json" --quiet
```

Then run the scheduled task manually.

Expected result:

- Same config path is used.
- Same lock behavior applies.
- Same import filtering and duplicate-safe behavior applies.
- Scheduled run has no visible UI except configured notifications.

## Security Check

- Inspect scheduler status; no token values appear.
- Inspect the registered task action; no token values appear.
- Inspect generated launcher file if present; no token values appear.
- Verify the registered task action points to the hidden launcher rather than
  directly to `mono-lunchmoney`, `node.exe`, `cmd.exe`, or `powershell.exe`.
