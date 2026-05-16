# Data Model: Hidden Scheduled Sync

## BackgroundScheduledSyncTask

Represents the Windows scheduled task that triggers background sync.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| taskName | string | yes | User-visible task name |
| dailyAt | HH:mm | yes | Local daily trigger time |
| actionExecutable | string | yes | Consoleless launcher executable registered with Task Scheduler |
| actionArguments | string | yes | Short token-free launcher arguments |
| configPath | path | yes | Config path used by the underlying sync command |
| enabled | boolean | yes | Whether scheduler is configured in app config |

### Validation Rules

- Task action must not contain API tokens or credential values.
- Task action must not directly launch a visible console command.
- Reinstall must replace the previous task action for the same task name.

## HiddenSyncLauncher

Represents the user-profile launcher artifact used to run sync hidden.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| path | path | yes | Stored under the user's app runtime directory |
| commandLine | string | yes | Underlying quiet sync command with config path |
| windowBehavior | enum | yes | `hidden` |
| waitForCompletion | boolean | yes | Must wait for sync to finish |
| propagatesExitCode | boolean | yes | Must return sync exit code to scheduler |

### Validation Rules

- Must not contain API tokens.
- Must not contain full account identifiers.
- Must be regenerated on scheduler reinstall so it reflects the current config path.
- Must handle paths with spaces.

## SchedulerStatusSummary

Sanitized user-facing status for scheduler inspection.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| exists | boolean | yes | Whether task exists |
| taskName | string | yes | Task name |
| nextRunTime | datetime | no | From Windows task info |
| lastRunTime | datetime | no | From Windows task info |
| lastResultCode | number | no | Last scheduler result |
| registeredCommand | string | no | Concise underlying sync command |

### Validation Rules

- Must show the underlying sync command rather than launcher internals when available.
- Must sanitize token-like values and sensitive account identifiers.
- Must remain useful if launcher file is missing by showing a sanitized fallback.

## NotificationOutcome

Represents visible notification behavior for scheduled sync events.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| eventType | enum | yes | success, failure, partial failure, lock held |
| enabledByConfig | boolean | yes | Derived from saved notification settings |
| visibleToUser | boolean | yes | True only when enabled by config |

## Relationships

- `BackgroundScheduledSyncTask` points to `HiddenSyncLauncher`.
- `HiddenSyncLauncher` runs the same quiet sync operation that a user could run manually.
- `SchedulerStatusSummary` is derived from Windows task metadata plus launcher contents when available.
- `NotificationOutcome` is controlled by saved notification settings, not by scheduler registration.
