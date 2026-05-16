# Feature Specification: Windows Notifications

**Feature Branch**: `003-windows-notifications`
**Created**: 2026-05-16
**Status**: Draft
**Input**: User description: "We need notification support with option to enable it or disable, notifications should be spawned just as notification, only Windows currently will be supported"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enable Or Disable Notifications (Priority: P1)

As a user who runs the sync tool locally, I want to control whether the app shows local Windows notifications so that scheduled/background sync results can be visible without forcing notifications on users who do not want them.

**Why this priority**: Notification control is the core value of the feature. Users must be able to opt in or opt out before any background alerts are useful or acceptable.

**Independent Test**: Configure notifications as enabled, run a command that produces a notification-worthy event, and verify a Windows notification is requested. Configure notifications as disabled, run the same event, and verify no notification is requested.

**Acceptance Scenarios**:

1. **Given** notifications are disabled in the saved configuration, **When** a notification-worthy event occurs, **Then** no local notification is shown or requested.
2. **Given** notifications are enabled in the saved configuration, **When** a notification-worthy event occurs on Windows, **Then** the user receives a local Windows notification.
3. **Given** the user views configuration, **When** notification settings are displayed, **Then** the enabled/disabled state is visible without exposing secrets or sensitive financial data.

---

### User Story 2 - Notify About Background Sync Problems (Priority: P1)

As a user with daily scheduled sync enabled, I want local notifications for sync failures so that I can notice and fix problems without manually checking logs every day.

**Why this priority**: The scheduled task runs without prompts. Failure notifications make background operation actionable while preserving the existing log-based troubleshooting path.

**Independent Test**: With notifications enabled, simulate a scheduled or quiet sync failure and verify a local notification is requested with a concise, sanitized failure summary. Repeat with notifications disabled and verify no notification is requested.

**Acceptance Scenarios**:

1. **Given** notifications are enabled and a scheduled sync fails, **When** the command exits, **Then** a Windows notification summarizes that sync failed and points the user to logs or config inspection.
2. **Given** notifications are enabled and one mapped account fails while others complete, **When** sync finishes with partial failure, **Then** a Windows notification states that sync finished with failures.
3. **Given** notifications are enabled and a failure message contains a token-like value or full account identifier, **When** the notification is shown, **Then** the notification text is sanitized.

---

### User Story 3 - Notify About Successful Background Sync (Priority: P2)

As a user who wants confirmation that automated sync is working, I want an optional success notification so that I can see that the daily run completed without opening logs.

**Why this priority**: Success notifications are useful for reassurance, but failure visibility is more important and less noisy.

**Independent Test**: Configure notifications for success and failure events, run a successful quiet sync, and verify a success notification is requested. Configure failure-only notifications and verify successful syncs do not request notifications.

**Acceptance Scenarios**:

1. **Given** success notifications are enabled, **When** a quiet sync completes successfully, **Then** a Windows notification summarizes the successful completion.
2. **Given** success notifications are disabled but failure notifications are enabled, **When** a quiet sync completes successfully, **Then** no success notification is shown.

---

### Edge Cases

- What happens when notifications are enabled on a non-Windows platform?
- What happens when Windows notification delivery is unavailable or blocked by user/system settings?
- What happens when notification text would include API tokens, full PANs, full IBANs, or long account identifiers?
- What happens when sync exits because another sync already holds the lock?
- What happens when a notification attempt fails after sync/backfill has already completed?
- What happens when the app runs non-interactively from Windows Task Scheduler?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to enable or disable local notifications through saved configuration.
- **FR-002**: Notifications MUST be disabled by default unless the user explicitly enables them.
- **FR-003**: The system MUST support local notification delivery on Windows.
- **FR-004**: The system MUST treat non-Windows notification delivery as unsupported for this feature and MUST continue the underlying command without failing solely because notifications are unsupported.
- **FR-005**: When notifications are enabled, the system MUST notify the user when a quiet or scheduled sync fails.
- **FR-006**: When notifications are enabled, the system MUST notify the user when sync completes with partial account failures.
- **FR-007**: Users MUST be able to choose whether successful sync completion produces a notification.
- **FR-008**: Notification content MUST be concise and include the event outcome, such as success, failure, partial failure, or lock already held.
- **FR-009**: Notification content MUST NOT include API tokens, full PANs, full IBANs, full account numbers, or unsanitized long account identifiers.
- **FR-010**: Notification failures MUST be recorded in troubleshooting output or logs but MUST NOT change the result of the sync/backfill operation that triggered the notification.
- **FR-011**: Non-interactive commands MUST NOT prompt the user to enable, disable, allow, retry, or configure notifications.
- **FR-012**: Configuration display MUST show notification settings in sanitized form.
- **FR-013**: Existing behavior for users who do not enable notifications MUST remain unchanged.

### Constitution-Aligned Requirements

- **CAR-001**: The feature MUST NOT introduce a local transaction database or imported transaction cursor as source of truth.
- **CAR-002**: Notification settings MAY be stored as static configuration; notification history MUST NOT be used as imported transaction state.
- **CAR-003**: Non-setup commands in scope MUST run without prompts.
- **CAR-004**: Tokens MUST NOT be stored in plain config, passed as arguments, printed, logged, or shown in notifications.
- **CAR-005**: Sensitive account identifiers MUST be masked in console output, config display, logs, and notifications.
- **CAR-006**: Scheduler-related behavior MUST remain compatible with Windows Task Scheduler and MUST NOT include API tokens in the registered command.
- **CAR-007**: Notification support MUST NOT weaken existing sync idempotency, lock handling, or duplicate-safe import behavior.

### Key Entities *(include if feature involves data)*

- **Notification Settings**: User-controlled configuration that records whether local notifications are enabled and whether successful sync completion should notify.
- **Notification Event**: A runtime event that may produce a local notification, including sync success, sync failure, partial failure, lock already held, or notification delivery failure.
- **Notification Message**: The sanitized title/body content presented to the user for a notification event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can enable or disable notifications and verify the saved state in under 2 minutes.
- **SC-002**: With notifications disabled, 100% of notification-worthy events complete without requesting a local notification.
- **SC-003**: With notifications enabled on Windows, 100% of sync failures and partial failures request a local notification.
- **SC-004**: 100% of generated notification messages are free of API tokens, full PANs, full IBANs, and full account numbers in validation tests.
- **SC-005**: Notification delivery failure does not alter the original sync/backfill exit outcome in 100% of tested failure scenarios.
- **SC-006**: Existing sync and scheduler workflows remain non-interactive in 100% of tested notification-enabled and notification-disabled runs.

## Assumptions

- "Notifications" means local operating-system notifications visible to the current Windows user, not email, push, webhook, chat, or hosted notification delivery.
- Windows is the only supported notification platform for this feature.
- Notifications are opt-in and disabled by default to avoid surprising users during scheduled runs.
- Failure and partial-failure notifications are the primary notification use case; success notifications are optional to reduce noise.
- Notification settings are static configuration and do not represent sync progress or imported transaction state.
