# Research: Hidden Scheduled Sync

## Decision: Use a consoleless scheduled launcher instead of registering the CLI directly

The scheduled task should invoke a small background launcher that runs the real sync command hidden and waits for completion.

**Rationale**: Registering `node.exe`, `mono-lunchmoney.cmd`, or a console executable directly can open a terminal or blank console window when Task Scheduler starts the action. A consoleless launcher avoids user-visible UI while preserving the normal sync command.

**Alternatives considered**:

- Register `mono-lunchmoney sync --quiet` directly: rejected because the user reports a visible terminal and blank console.
- Register a hidden PowerShell action: rejected because PowerShell itself can still flash or spawn a visible host window on some systems and produces long task arguments.
- Build a native GUI-subsystem executable: rejected as too heavy for the current CLI and packaging model.

## Decision: Keep the registered task action short and store detailed launch instructions in a user-profile launcher file

The task action should be concise, token-free, and point to a generated launcher file under the app's user-profile runtime directory.

**Rationale**: Long Task Scheduler arguments are hard to inspect, easy to quote incorrectly, and confusing in status output. A short action is easier to replace on reinstall and easier to troubleshoot.

**Alternatives considered**:

- Put the entire hidden-launch command in Task Scheduler arguments: rejected because it is long and was already identified as user-hostile.
- Store launch instructions in config.json: rejected because scheduler execution details are operational runtime data and should not clutter user config.
- Require a global helper binary: rejected because it complicates installation.

## Decision: Preserve the underlying sync command as the user-facing status value

Scheduler status should display the intended sync operation, not internal launcher details.

**Rationale**: Users need to confirm the task runs sync with the expected config path. Showing wrapper internals makes the status output look wrong even when the task is correct.

**Alternatives considered**:

- Display raw Task Scheduler action exactly as registered: rejected because it exposes wrapper details and can be very long.
- Hide the command entirely: rejected because users need troubleshooting visibility.

## Decision: Propagate sync exit code to Windows task history

The background launcher should wait for sync completion and return the sync exit code.

**Rationale**: The task must remain diagnosable from Windows task history and CLI scheduler status. A launcher that always exits zero would hide failures.

**Alternatives considered**:

- Fire-and-forget background start: rejected because Task Scheduler would report success before sync actually completes.
- Read logs only for status: rejected because the existing scheduler status model already includes last result code.

## Decision: Notifications remain the only user-visible scheduled-run output

Scheduled sync should never show a terminal or prompt; only saved notification settings may create visible UI.

**Rationale**: The user explicitly wants background execution with no visible output except notifications. This also preserves existing quiet sync behavior.

**Alternatives considered**:

- Allow a minimized terminal: rejected because it is still visible.
- Show scheduler success output: rejected because scheduled runs should be silent unless notification settings allow it.
