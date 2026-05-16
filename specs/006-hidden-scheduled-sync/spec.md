# Feature Specification: Hidden Scheduled Sync

**Feature Branch**: `006-hidden-scheduled-sync`
**Created**: 2026-05-17
**Status**: Draft
**Input**: User description: "We need to create scheduled task for calling sync in background. Nothing should be shown to user except notifications. Same behavior as to use simple sync command but hidden in background"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Scheduled Sync Invisibly (Priority: P1)

A user installs the daily scheduled sync and expects it to run in the background without any visible terminal, console, empty window, or interactive prompt.

**Why this priority**: The scheduled task is intended to be background automation. A visible console breaks trust, creates confusion, and makes the task feel broken even when sync is running.

**Independent Test**: Install the scheduled task, start it manually from the scheduler, and verify no terminal or console window appears while sync performs the same work as a normal quiet sync.

**Acceptance Scenarios**:

1. **Given** a valid configuration and saved credentials, **When** the scheduled task starts at its configured time, **Then** sync runs without showing any visible terminal, console, or prompt.
2. **Given** a valid configuration and saved credentials, **When** the user manually starts the scheduled task from Windows task controls, **Then** sync still runs without showing any visible terminal, console, or prompt.
3. **Given** notifications are enabled, **When** scheduled sync finishes, fails, or is blocked by the existing lock according to notification settings, **Then** only the configured notification may be shown to the user.

---

### User Story 2 - Preserve Normal Sync Behavior In Background (Priority: P1)

A user expects the scheduled background run to behave like running the ordinary sync command with the same configuration, except that it has no visible UI.

**Why this priority**: Hiding the scheduler must not change financial import behavior, error handling, notifications, credentials, or logs.

**Independent Test**: Compare a manual quiet sync and a scheduled background sync against the same mocked configuration and statements, then verify they use the same config path, import decisions, logging, notifications, lock handling, and exit outcome.

**Acceptance Scenarios**:

1. **Given** scheduled sync is installed, **When** it runs, **Then** it uses the saved config path and imports the same eligible transactions as a manual sync using that config.
2. **Given** another sync is already running, **When** the scheduled task starts, **Then** existing lock behavior prevents overlap and any configured lock notification is still eligible to appear.
3. **Given** provider credentials are missing or invalid, **When** the scheduled task runs, **Then** it fails non-interactively, writes sanitized logs, and shows only configured notifications.

---

### User Story 3 - Inspect A Simple Scheduler Setup (Priority: P2)

A user can inspect scheduler status and understand that the task runs the sync command in background without exposing secrets or overwhelming implementation details.

**Why this priority**: Users need confidence that the scheduler is correctly installed and token-safe, especially when troubleshooting background execution.

**Independent Test**: Install the scheduler, run scheduler status, and verify the displayed command is concise, token-free, and describes the intended sync run rather than a confusing internal wrapper.

**Acceptance Scenarios**:

1. **Given** the scheduled task is installed, **When** the user runs scheduler status, **Then** the displayed command clearly represents the underlying sync operation and config path.
2. **Given** the scheduled task is installed, **When** the user inspects status output, **Then** no API token, full credential value, or unrelated internal script content is displayed.

---

### Edge Cases

- Scheduled sync is started manually by the user from Windows scheduler controls.
- Scheduled sync starts while another sync or backfill already holds the lock.
- Scheduled sync fails before provider calls because credentials are missing or inaccessible.
- Scheduled sync fails after partial account processing.
- Notifications are disabled.
- Notifications are enabled for failures only.
- The configured sync path contains spaces.
- The config path contains spaces.
- The application has been installed globally rather than run from the repository.
- The previous visible scheduled task already exists and is reinstalled.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Scheduler install MUST create or update a scheduled task that runs sync fully in the background without showing a terminal, console, command prompt, empty window, or interactive prompt to the user.
- **FR-002**: Manual starts of the scheduled task MUST have the same hidden background behavior as time-triggered starts.
- **FR-003**: Scheduled background sync MUST use the same saved config path and sync behavior as the equivalent quiet sync command.
- **FR-004**: Scheduled background sync MUST preserve existing lock handling, logging, import filtering, duplicate safety, and notification behavior.
- **FR-005**: The only user-visible output from scheduled background sync MUST be notifications allowed by the saved notification settings.
- **FR-006**: Scheduler status MUST present a concise, sanitized representation of the sync operation rather than exposing confusing internal launcher details.
- **FR-007**: Scheduler install and status MUST NOT expose API tokens, credential values, full account identifiers, or other sensitive values.
- **FR-008**: Reinstalling the scheduler MUST replace or update any previous visible-console task so future runs use the hidden background behavior.
- **FR-009**: If the hidden background launcher cannot be prepared or registered, scheduler install MUST fail clearly rather than installing a task that opens a visible console.
- **FR-010**: Scheduled background execution MUST report success or failure to Windows task history using the sync result, so manual troubleshooting remains possible.

### Constitution-Aligned Requirements

- **CAR-001**: The feature MUST NOT introduce a local transaction database or imported transaction cursor as source of truth.
- **CAR-002**: Any imported transaction MUST preserve deterministic idempotency through Lunch Money `external_id`.
- **CAR-003**: Non-setup commands in scope MUST run without prompts.
- **CAR-004**: Tokens MUST NOT be stored in plain config, passed as arguments, printed, or logged.
- **CAR-005**: Sensitive account identifiers MUST be masked in console output, config display, and logs.
- **CAR-006**: Monobank statement windows, rate limits, and 500-item paging MUST be represented when statement fetching is in scope.
- **CAR-007**: Lunch Money imports MUST use manual assets, max 500-item batches, `status: "uncleared"`, configured tags, compact notes, and duplicate-safe insert options when transaction import is in scope.
- **CAR-008**: Scheduler behavior in scope MUST use Windows Task Scheduler and MUST NOT include API tokens in the registered command.

### Key Entities *(include if feature involves data)*

- **Background Scheduled Sync Task**: The saved Windows schedule that triggers sync without visible UI.
- **Hidden Sync Launch Configuration**: The stored execution details needed for the background task to start sync using the saved config path.
- **Scheduler Status Summary**: A sanitized user-facing view of the registered task, next run, last run, last result, and underlying sync operation.
- **Notification Outcome**: The optional visible notification generated according to saved notification settings after scheduled sync events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In manual and scheduled task starts, zero terminal, console, command prompt, or empty windows appear during the scheduled sync run.
- **SC-002**: A scheduled background run imports the same eligible transactions and writes the same sanitized sync/error logs as the equivalent quiet sync command for the same config and statements.
- **SC-003**: Scheduler status output reveals zero API tokens, credential values, full card numbers, full IBANs, or full account identifiers.
- **SC-004**: Reinstalling over an existing scheduler task results in the next task run using hidden background behavior.
- **SC-005**: When notifications are disabled, scheduled background sync produces no user-visible UI.
- **SC-006**: When notifications are enabled, the only user-visible UI is the configured notification for the relevant sync outcome.

## Assumptions

- The tool remains a local Windows-friendly CLI without a hosted service.
- API tokens are available through environment variables or secure user storage.
- Lunch Money API v1 is the target unless a later spec explicitly changes it.
- Static/semi-static config may be stored; imported transaction state may not.
- Existing notification settings continue to control whether success, failure, partial failure, or lock-held notifications are shown.
- The scheduled task runs under the same Windows user context that can access the saved config and credentials.
