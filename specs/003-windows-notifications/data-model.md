# Data Model: Windows Notifications

## NotificationConfig

Represents saved user preferences for local notifications. Persisted as static
configuration in `config.json`.

**Fields**:

- `enabled: boolean` - default `false`.
- `notifyOnSuccess: boolean` - default `false`.
- `notifyOnFailure: boolean` - default `true` when notifications are enabled.
- `notifyOnPartialFailure: boolean` - default `true` when notifications are
  enabled.
- `notifyOnLockHeld: boolean` - default `true` when notifications are enabled.

**Validation rules**:

- Must not contain API tokens or credentials.
- Must not contain notification history, last notification time, sync cursor,
  imported transaction ids, or any imported transaction progress.
- Config display must show settings in sanitized form.

**State transitions**:

- Disabled to enabled: future notification-worthy events may request Windows
  notifications according to the event flags.
- Enabled to disabled: future events must not request local notifications.
- Success notification opt-in can change independently from failure alerts.

## NotificationEvent

Runtime-only event emitted by sync/backfill or command error handling.

**Fields**:

- `type: "sync-success" | "sync-failure" | "sync-partial-failure" | "lock-held" | "notification-failure"`
- `sourceCommand: "sync" | "backfill" | "scheduler" | "config"`
- `quiet: boolean` - whether the event came from a quiet/scheduled-style run.
- `summary: string` - concise event summary.
- `details?: string` - optional sanitized diagnostic detail.
- `logPath?: string` - optional path where the user can inspect logs.
- `occurredAt: Date`

**Validation rules**:

- Runtime only; not persisted as history.
- Must be sanitized before delivery.
- Must not include full provider payloads or full transaction metadata.
- Events from disabled notification settings must be ignored before delivery.

## NotificationMessage

Sanitized message sent to a notifier.

**Fields**:

- `title: string` - concise, user-visible title.
- `body: string` - concise, user-visible body.
- `severity: "info" | "warning" | "error"`

**Validation rules**:

- Title and body must be sanitized for tokens and sensitive financial
  identifiers.
- Message must be concise enough for Windows notification display.
- Must not include API tokens, full PANs, full IBANs, full account numbers, or
  unsanitized long account identifiers.

## NotificationDeliveryResult

Runtime-only result returned by the notifier.

**Fields**:

- `status: "delivered" | "skipped" | "failed"`
- `reason?: string`

**Validation rules**:

- Delivery failure must be logged or surfaced for troubleshooting.
- Delivery failure must not replace or alter the original sync/backfill exit
  outcome.
- Non-Windows delivery returns `skipped` with an unsupported-platform reason.

## WindowsNotificationAdapter

Boundary responsible for local Windows notification delivery.

**Fields/Capabilities**:

- `isSupported(): boolean`
- `notify(message: NotificationMessage): Promise<NotificationDeliveryResult>`

**Validation rules**:

- Must report unsupported outside Windows.
- Must not receive unsanitized message content.
- Must be injectable or mockable for tests so automated validation does not
  require real notification display.
