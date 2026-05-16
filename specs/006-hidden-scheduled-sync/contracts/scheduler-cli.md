# CLI Contract: Hidden Scheduled Sync

## scheduler install

Command:

```powershell
mono-lunchmoney scheduler install --daily-at 20:00
mono-lunchmoney scheduler install --daily-at 20:00 --config "C:\path\config.json"
```

Required behavior:

- Creates or updates the Windows scheduled task for the chosen task name.
- Registers a background action that does not open a terminal, console, or prompt.
- Uses the saved config path for the underlying sync operation.
- Replaces prior visible-console task actions on reinstall.
- Writes or refreshes any required user-profile launcher artifact.
- Fails clearly if the hidden launcher cannot be prepared.
- Does not include API tokens in task action, launcher content, output, or config.

Expected user-facing output:

```text
Scheduler Installed

Task name:  MonoLunchMoneySync
Daily at:   20:00
Command:    mono-lunchmoney sync --config "<configPath>" --quiet
Mode:       hidden background
```

## scheduler status

Command:

```powershell
mono-lunchmoney scheduler status
```

Required behavior:

- Runs without prompts.
- Shows task existence, task name, next run time, last run time, last result code, and the concise underlying sync command.
- Does not show long launcher internals when the underlying command can be resolved.
- Sanitizes token-like values and sensitive identifiers.

Expected user-facing output:

```text
Scheduler Status

Task exists:       yes
Task name:         MonoLunchMoneySync
Last result code:  0
Command:           mono-lunchmoney sync --config "<configPath>" --quiet
Mode:              hidden background
```

## scheduler uninstall

Command:

```powershell
mono-lunchmoney scheduler uninstall
```

Required behavior:

- Removes the Windows scheduled task.
- Runs without prompts.
- May leave harmless runtime launcher files unless the implementation can safely remove only files it owns.

## Scheduled Run

Required behavior:

- Starts sync with the saved config path and quiet behavior.
- Shows no terminal, console, command prompt, empty window, or prompt.
- Waits for sync completion.
- Returns sync success/failure to scheduler task history.
- Shows only configured notifications.
