# Tasks: Windows Notifications

**Input**: Design documents from `specs/003-windows-notifications/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required. The feature specification, plan, and quickstart require
unit and mocked integration coverage for notification config defaults,
enable/disable behavior, message sanitization, Windows-only delivery decisions,
notifier failure handling, sync/backfill failure notifications, lock-held
notifications, partial-failure notifications, success notification opt-in, and
unchanged command exit semantics.

**Organization**: Tasks are grouped by user story so each story can be
implemented and verified independently after the foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because files and dependencies do not overlap
- **[Story]**: User story label, such as US1, US2, US3
- All task descriptions include exact repository-relative file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare notification module directories and shared test fixtures on
top of the existing TypeScript CLI implementation.

- [X] T001 Create notification source directory `src/notifications/`
- [X] T002 [P] Create notification unit test directory `tests/unit/notifications/`
- [X] T003 [P] Create notification integration test directory `tests/integration/notifications/`
- [X] T004 [P] Add reusable notification fixture builders in `tests/fixtures/notifications.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core notification types, config schema, message sanitization,
delivery adapter, and notification service that block all user-story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Add notification config schema tests for disabled defaults, enabled defaults, and token-free serialization in `tests/unit/notifications/notification-config.test.ts`
- [X] T006 [P] Add notification message tests for event-to-title/body mapping and token/account sanitization in `tests/unit/notifications/notification-message.test.ts`
- [X] T007 [P] Add notification service tests for disabled settings, event preference filtering, skipped delivery logging, and delivery failure logging in `tests/unit/notifications/notification-service.test.ts`
- [X] T008 [P] Add Windows notifier tests for supported-platform detection, unsupported-platform skip, executor success, executor failure, and sanitized command inputs in `tests/unit/notifications/windows-notifier.test.ts`
- [X] T009 Define notification event, message, delivery result, adapter, and config types in `src/notifications/notification-types.ts`
- [X] T010 Extend app config schema with static notification settings in `src/config/config.model.ts`
- [X] T011 Implement notification config defaults and helper functions in `src/notifications/notification-config.ts`
- [X] T012 Implement event-to-message builder with final sanitization in `src/notifications/notification-message.ts`
- [X] T013 Implement notification service preference filtering, delivery handling, skipped logging, and failure logging in `src/notifications/notification-service.ts`
- [X] T014 Implement Windows-only notification adapter with injectable executor in `src/notifications/windows-notifier.ts`
- [X] T015 Extend sanitized config summary to include notification settings in `src/config/config.loader.ts`

**Checkpoint**: Notification contracts, config, sanitization, and delivery
boundaries are tested and ready for command/story integration.

---

## Phase 3: User Story 1 - Enable Or Disable Notifications (Priority: P1) MVP

**Goal**: A user can opt in or opt out of Windows notifications through setup or
config commands, inspect the saved state, and disabled notifications request no
delivery.

**Independent Test**: Configure notifications as enabled, run a notification
event through a mocked notifier, and verify delivery is requested. Configure
notifications as disabled, run the same event, and verify no delivery is
requested. Verify config display shows sanitized notification settings.

### Tests for User Story 1

- [X] T016 [P] [US1] Add config notification enable/disable/status integration tests in `tests/integration/notifications/config-notifications-command.test.ts`
- [X] T017 [P] [US1] Add setup prompt integration tests for notification disabled default, enabled failure-only, and enabled success options in `tests/integration/notifications/setup-notifications.test.ts`
- [X] T018 [P] [US1] Add config show sanitization tests for notification settings in `tests/unit/commands/config-notifications-show.test.ts`
- [X] T019 [P] [US1] Add disabled-notifications service integration test proving no notifier call in `tests/integration/notifications/disabled-notifications.test.ts`

### Implementation for User Story 1

- [X] T020 [US1] Add `config notifications enable|disable|status` command wiring in `src/commands/config.command.ts`
- [X] T021 [US1] Add notification settings write helpers preserving existing mappings and scheduler settings in `src/config/config.writer.ts`
- [X] T022 [US1] Add setup prompts for notification enablement and success opt-in in `src/commands/setup.command.ts`
- [X] T023 [US1] Include notification settings in sanitized setup and config summaries in `src/config/config.loader.ts`
- [X] T024 [US1] Document notification enable/disable/status commands in `README.md`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Notify About Background Sync Problems (Priority: P1)

**Goal**: Quiet or scheduled sync/backfill failures, partial failures, and
lock-held exits request sanitized Windows notifications when notifications are
enabled, while disabled settings remain silent.

**Independent Test**: With notifications enabled and a mocked notifier, simulate
sync failure, partial failure, lock-held, and backfill failure paths. Verify
sanitized notification requests are made and the original command exit outcomes
are unchanged. Repeat key paths with notifications disabled and verify no
notification request.

### Tests for User Story 2

- [X] T025 [P] [US2] Add quiet sync failure notification integration test in `tests/integration/notifications/sync-failure-notification.test.ts`
- [X] T026 [P] [US2] Add partial account failure notification integration test in `tests/integration/notifications/sync-partial-failure-notification.test.ts`
- [X] T027 [P] [US2] Add lock-held notification integration test preserving lock exit code in `tests/integration/notifications/sync-lock-held-notification.test.ts`
- [X] T028 [P] [US2] Add backfill failure notification integration test in `tests/integration/notifications/backfill-failure-notification.test.ts`
- [X] T029 [P] [US2] Add notification failure policy integration test proving original sync/backfill exit outcome is unchanged in `tests/integration/notifications/notification-delivery-failure-policy.test.ts`
- [X] T030 [P] [US2] Add notification text sanitization integration test for token-like and account-like values in `tests/integration/notifications/notification-sanitization.test.ts`

### Implementation for User Story 2

- [X] T031 [US2] Add notification dependency injection and runtime notifier construction in `src/commands/sync.command.ts`
- [X] T032 [US2] Emit sync failure, partial-failure, and lock-held notification events from `src/commands/sync.command.ts`
- [X] T033 [US2] Add notification dependency injection and runtime notifier construction in `src/commands/backfill.command.ts`
- [X] T034 [US2] Emit backfill failure, partial-failure, and lock-held notification events from `src/commands/backfill.command.ts`
- [X] T035 [US2] Extend sync runner result details needed for partial-failure notification summaries in `src/sync/sync-runner.ts`
- [X] T036 [US2] Ensure notification delivery diagnostics are appended through sanitized logger helpers in `src/logging/logger.ts`
- [X] T037 [US2] Document failure, partial-failure, lock-held, and delivery-failure notification behavior in `README.md`

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Notify About Successful Background Sync (Priority: P2)

**Goal**: A user can explicitly opt in to success notifications, and successful
sync/backfill runs notify only when the success preference is enabled.

**Independent Test**: Configure notifications with success enabled and run a
successful quiet sync/backfill against mocked providers; verify a success
notification is requested. Configure failure-only notifications and verify
successful runs do not notify.

### Tests for User Story 3

- [X] T038 [P] [US3] Add sync success notification opt-in integration test in `tests/integration/notifications/sync-success-notification.test.ts`
- [X] T039 [P] [US3] Add failure-only no-success-notification integration test in `tests/integration/notifications/sync-success-disabled-notification.test.ts`
- [X] T040 [P] [US3] Add backfill success notification opt-in integration test in `tests/integration/notifications/backfill-success-notification.test.ts`

### Implementation for User Story 3

- [X] T041 [US3] Emit sync success notification events only when success preference is enabled in `src/commands/sync.command.ts`
- [X] T042 [US3] Emit backfill success notification events only when success preference is enabled in `src/commands/backfill.command.ts`
- [X] T043 [US3] Extend notification message builder with concise success summaries in `src/notifications/notification-message.ts`
- [X] T044 [US3] Document success notification opt-in and failure-only mode in `README.md`

**Checkpoint**: All selected user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, docs, and governance checks across the
notification feature.

- [X] T045 [P] Update feature quickstart with final command output examples and validation notes in `specs/003-windows-notifications/quickstart.md`
- [X] T046 [P] Update README command example tests for notification commands in `tests/unit/docs/readme-examples.test.ts`
- [X] T047 [P] Add end-to-end notification coverage from setup to quiet sync failure in `tests/integration/notifications/setup-to-sync-notification.test.ts`
- [X] T048 Verify scheduler command examples remain token-free and notification-flag-free in `src/scheduler/windows-task-scheduler.ts` and `README.md`
- [X] T049 Verify notification config writes do not store notification history or imported transaction progress in `src/config/config.writer.ts` and `src/notifications/notification-service.ts`
- [X] T050 Run build, test, and lint verification and record notes in `specs/003-windows-notifications/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1 Enable Or Disable Notifications**: Depends on Phase 2 and is the MVP.
- **Phase 4 US2 Problem Notifications**: Depends on Phase 2 and uses config behavior from US1 for real user flow.
- **Phase 5 US3 Success Notifications**: Depends on Phase 2 and builds on the same notification service used by US2.
- **Phase 6 Polish**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 Enable Or Disable Notifications (P1)**: MVP. Can start after foundation.
- **US2 Notify About Background Sync Problems (P1)**: Can start after foundation with fixture config, but full product flow depends on US1 controls.
- **US3 Notify About Successful Background Sync (P2)**: Can start after foundation, but reuses US1 preferences and US2 command notification integration.

### Within Each User Story

- Write story tests before or alongside implementation.
- Define config/schema/types before command wiring.
- Implement notification service and adapter before workflow integration.
- Integrate command outcomes before documentation.
- Keep notification failure handling separate from sync/backfill exit semantics.

### Parallel Opportunities

- Phase 1 directory/fixture tasks T002 through T004 can run in parallel after T001.
- Foundational tests T005 through T008 can run in parallel because they touch separate files.
- US1 tests T016 through T019 can run in parallel before command/setup wiring.
- US2 tests T025 through T030 can run in parallel because they cover separate outcome paths.
- US3 tests T038 through T040 can run in parallel.
- Polish documentation/test tasks T045 through T047 can run in parallel after story behavior stabilizes.

### Parallel Execution Examples

```powershell
# Foundational test drafting
codex task T005
codex task T006
codex task T007
codex task T008
```

```powershell
# US1 parallel tests
codex task T016
codex task T017
codex task T018
codex task T019
```

```powershell
# US2 independent outcome tests
codex task T025
codex task T026
codex task T027
codex task T028
codex task T029
codex task T030
```

## Implementation Strategy

### MVP First

Complete Phase 1, Phase 2, and Phase 3 (US1). This delivers the opt-in/opt-out
configuration surface and proves disabled notifications remain silent.

### Incremental Delivery

1. Add US2 to deliver the highest-value operational notifications for failures,
   partial failures, and lock-held exits.
2. Add US3 to support optional success notifications for users who want
   confirmation of scheduled runs.
3. Finish polish with documentation, end-to-end coverage, and final validation.

### Validation Gates

- After Phase 2: run targeted unit tests for `tests/unit/notifications/`.
- After US1: run config notification command and setup integration tests.
- After US2: run sync/backfill failure, partial failure, lock-held, and delivery
  failure integration tests.
- After US3: run success opt-in and failure-only success-disabled integration
  tests.
- Final: run `npm run build`, `npm test`, and `npm run lint`.

## Task Summary

- **Total tasks**: 50
- **US1 tasks**: 9
- **US2 tasks**: 13
- **US3 tasks**: 7
- **Parallelizable tasks**: 23
- **Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1)

## Format Validation

All executable tasks above use the required checklist format:
`- [ ] T### [P?] [US?] Description with file path`.
