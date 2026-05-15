# Data Model: Node CLI Project Initialization

## CLI Package

Represents the installable distribution that provides `mono-lunchmoney`.

**Fields**:

- `name`: package name.
- `version`: semantic version string.
- `description`: short tool purpose.
- `license`: project license identifier.
- `binName`: must be `mono-lunchmoney`.
- `entrypoint`: built CLI file exposed by `binName`.
- `supportedPlatformNotes`: text describing Windows scheduler support.
- `engineRange`: supported Node.js runtime range.

**Validation rules**:

- `binName` must equal `mono-lunchmoney`.
- `version` must be semantic-version compatible.
- `entrypoint` must resolve to packaged build output.
- Package metadata must not contain API tokens or user-specific paths.

## CLI Command

Represents a user-facing command exposed by the installed CLI.

**Fields**:

- `name`: command or subcommand name.
- `description`: concise help text.
- `interactive`: whether the command may prompt.
- `options`: supported command options.
- `requiresConfig`: whether a saved config is required.
- `writesRuntimeFiles`: whether config/log/lock directories may be created.
- `exitCodes`: expected success and failure exit codes.

**Validation rules**:

- `setup` may be interactive.
- `sync`, `scheduler status`, `scheduler uninstall`, and `config show` must not
  prompt.
- Commands must reject token-like options.
- Help must be available without credentials or config.

## Runtime Path Set

Represents default user-level file locations.

**Fields**:

- `configPath`: default saved config path.
- `syncLogPath`: default success/activity log path.
- `errorLogPath`: default error log path.
- `lockPath`: default sync lock path.
- `appDataDirectory`: parent directory for runtime files.

**Validation rules**:

- Defaults must live under the current user's profile.
- Directories are created only when a command needs to write.
- Displayed paths must not include credentials.
- Explicit config path overrides affect only commands receiving that option.

## Background Schedule

Represents the Windows scheduled task managed by the CLI.

**Fields**:

- `taskName`: default `MonoLunchMoneySync`.
- `dailyAt`: local daily time in `HH:mm`.
- `command`: executable and arguments registered with the scheduler.
- `configPath`: config path passed to quiet sync.
- `enabled`: whether the task is installed.
- `runMode`: current-user, run when logged on for first version.

**Validation rules**:

- `dailyAt` must be a valid 24-hour time.
- `command` must invoke `sync --quiet` through the installed CLI.
- `command` must include a config path.
- `command` must not include API tokens or token-like values.
- Non-Windows scheduler install must fail with a clear message.

## Scheduler Status

Represents status displayed to the user.

**Fields**:

- `exists`: whether the task is registered.
- `taskName`: registered task name.
- `nextRunTime`: scheduler-reported next run time, if any.
- `lastRunTime`: scheduler-reported last run time, if any.
- `lastResultCode`: scheduler-reported result code, if any.
- `registeredCommand`: sanitized command string.

**Validation rules**:

- Status must be printable without credentials.
- Missing task status must still be a successful command result unless an
  unexpected scheduler access error occurs.
- Registered command output must be sanitized.

## Failure Record

Represents discoverable failure information for background runs.

**Fields**:

- `timestamp`: local timestamp.
- `source`: command or scheduler operation.
- `message`: sanitized human-readable failure reason.
- `exitCode`: process exit code, if available.
- `logPath`: path where details are written.

**Validation rules**:

- Must not include API tokens, full PANs, full IBANs, or full account numbers.
- Failed non-interactive commands must return non-zero.
- Failure records support future active notifications but do not send them in
  this feature.

## Notification Follow-Up

Represents the explicitly deferred feature for active alerts.

**Fields**:

- `scope`: background issue and exception notifications.
- `status`: deferred.
- `inputs`: failure records, scheduler status, error logs.
- `candidateChannels`: desktop notification, email, or other channel decided
  later.

**Validation rules**:

- This feature may document the follow-up but must not implement active alerts.

## State Transitions

### Background Schedule

```text
Not Installed -> Installed -> Updated -> Uninstalled
       |              |
       |              -> Failed Status Read
       -> Install Failed
```

### CLI Runtime Paths

```text
Unresolved -> Resolved -> Directory Created -> Runtime File Written
```

### Failure Record

```text
No Failure -> Failure Captured -> Visible In Status/Logs -> Eligible For Future Notification
```
