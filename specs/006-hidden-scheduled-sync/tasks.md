---
description: "Task list for hidden scheduled sync implementation"
---

# Tasks: Hidden Scheduled Sync

**Input**: Design documents from `/specs/006-hidden-scheduled-sync/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because this feature touches scheduler command token safety, non-interactive execution, status sanitization, notification visibility, and Windows task exit behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently after the foundational scheduler launcher work is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because files and dependencies do not overlap
- **[Story]**: Which user story this task belongs to, such as US1, US2, US3
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared test and fixture support for hidden scheduler behavior.

- [X] T001 [P] Add hidden scheduler test fixture helpers for launcher paths, fake config paths, and safe token samples in `tests/fixtures/scheduler.ts`
- [X] T002 [P] Review the existing scheduler command and lifecycle test coverage, then document missing hidden-mode assertions in `specs/006-hidden-scheduled-sync/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared hidden launcher primitives used by all scheduler stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Extend runtime file helpers with a deterministic hidden scheduler launcher path under the user app runtime directory in `src/config/runtime-files.ts`
- [X] T004 Define hidden scheduler launcher constants, action executable selection, and launcher metadata shape in `src/scheduler/windows-task-scheduler.ts`
- [X] T005 Implement scheduler action and launcher content safety checks for token-like values and sensitive identifiers in `src/scheduler/windows-task-scheduler.ts`
- [X] T006 Add a shared scheduled sync command builder for `sync --config "<configPath>" --quiet` in `src/scheduler/windows-task-scheduler.ts`
- [X] T007 [P] Add unit coverage for hidden scheduler launcher path resolution in `tests/unit/config/runtime-files.test.ts`
- [X] T008 [P] Add unit coverage for scheduled sync command quoting and token safety in `tests/unit/scheduler/scheduler-command.test.ts`

**Checkpoint**: Hidden scheduler launcher primitives are ready; user story implementation can begin.

---

## Phase 3: User Story 1 - Run Scheduled Sync Invisibly (Priority: P1) MVP

**Goal**: Installed and manually started scheduled sync runs without showing a terminal, console, empty window, or prompt.

**Independent Test**: Install the scheduled task, start it manually from Windows Task Scheduler, and verify no visible window appears while sync runs and notifications remain the only allowed UI.

### Tests for User Story 1

- [X] T009 [P] [US1] Add integration coverage asserting scheduler install registers a consoleless launcher action instead of a direct CLI, Node, cmd, or PowerShell console action in `tests/integration/scheduler/windows-task-scheduler.test.ts`
- [X] T010 [P] [US1] Add reinstall coverage asserting an existing visible-console scheduler action is replaced by the hidden launcher action in `tests/integration/scheduler/scheduler-lifecycle.test.ts`
- [X] T011 [P] [US1] Add unit coverage for hidden launcher content using hidden window behavior and no interactive prompt in `tests/unit/scheduler/scheduler-command.test.ts`

### Implementation for User Story 1

- [X] T012 [US1] Generate or refresh the hidden scheduler launcher artifact during scheduler install in `src/scheduler/windows-task-scheduler.ts`
- [X] T013 [US1] Register the Windows scheduled task action through the consoleless launcher with short token-free arguments in `src/scheduler/windows-task-scheduler.ts`
- [X] T014 [US1] Make scheduler install fail clearly when hidden launcher preparation fails instead of falling back to a visible console action in `src/scheduler/windows-task-scheduler.ts`
- [X] T015 [US1] Update scheduler install output to show `Mode: hidden background` and the concise sync command in `src/commands/scheduler.command.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Preserve Normal Sync Behavior In Background (Priority: P1)

**Goal**: Scheduled background sync behaves like the normal quiet sync command with the same config, logs, locks, notifications, imports, and exit outcome.

**Independent Test**: Compare a manual quiet sync and scheduled background sync against the same mocked config and statements, then verify matching config path, import decisions, lock handling, notification eligibility, logging, and exit result.

### Tests for User Story 2

- [X] T016 [P] [US2] Add unit coverage proving the launcher runs `sync --config "<configPath>" --quiet`, waits for completion, and propagates the sync exit code in `tests/unit/scheduler/scheduler-command.test.ts`
- [X] T017 [P] [US2] Add integration coverage proving task action and launcher content contain no API tokens while using the saved config path in `tests/integration/scheduler/scheduler-secure-credentials.test.ts`
- [X] T018 [P] [US2] Add setup scheduler coverage proving setup-created scheduled tasks use the same hidden quiet sync command as `scheduler install` in `tests/integration/setup/setup-scheduler-install.test.ts`

### Implementation for User Story 2

- [X] T019 [US2] Reuse the scheduled sync command builder for hidden launcher command generation in `src/scheduler/windows-task-scheduler.ts`
- [X] T020 [US2] Ensure the hidden launcher waits for the sync process and exits with the sync process exit code in `src/scheduler/windows-task-scheduler.ts`
- [X] T021 [US2] Preserve scheduler config persistence for enabled, type, dailyAt, and taskName while installing hidden actions in `src/commands/scheduler.command.ts`
- [X] T022 [US2] Keep scheduled sync invocation quiet so only configured notification outcomes may be visible to the user in `src/scheduler/windows-task-scheduler.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Inspect A Simple Scheduler Setup (Priority: P2)

**Goal**: Scheduler status shows a concise, sanitized underlying sync command and hidden background mode without exposing launcher internals or secrets.

**Independent Test**: Install the scheduler, run `scheduler status`, and verify it shows task existence, timing, last result, concise sync command, hidden mode, and no token or sensitive values.

### Tests for User Story 3

- [X] T023 [P] [US3] Add unit coverage for extracting the underlying sync command from hidden launcher metadata in `tests/unit/scheduler/scheduler-status.test.ts`
- [X] T024 [P] [US3] Add command output coverage for hidden mode, concise command display, and token sanitization in `tests/unit/scheduler/scheduler-install-config.test.ts`

### Implementation for User Story 3

- [X] T025 [US3] Store resolvable underlying sync command metadata with the generated hidden launcher in `src/scheduler/windows-task-scheduler.ts`
- [X] T026 [US3] Prefer hidden launcher metadata over raw Task Scheduler wrapper internals when building scheduler status in `src/scheduler/windows-task-scheduler.ts`
- [X] T027 [US3] Sanitize and print concise command plus `Mode: hidden background` in scheduler status output in `src/commands/scheduler.command.ts`
- [X] T028 [US3] Add a sanitized fallback status command when the scheduler task exists but the hidden launcher file is missing in `src/scheduler/windows-task-scheduler.ts`

**Checkpoint**: All selected user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, packaging checks, and final validation for hidden scheduler behavior.

- [X] T029 [P] Update README scheduler instructions with hidden background behavior, manual Task Scheduler run check, notification-only UI, and token-safety notes in `README.md`
- [X] T030 [P] Update feature quickstart with reinstall verification and manual hidden-run validation details in `specs/006-hidden-scheduled-sync/quickstart.md`
- [X] T031 Run `npm run build` and fix hidden scheduler TypeScript errors in `src/scheduler/windows-task-scheduler.ts`
- [X] T032 Run `npm test` and fix hidden scheduler unit or integration failures in `tests/unit/scheduler/scheduler-command.test.ts`
- [X] T033 Run `npm run lint` and fix scheduler lint issues in `src/commands/scheduler.command.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP
- **User Story 2 (Phase 4)**: Depends on Foundational and may reuse US1 launcher registration behavior
- **User Story 3 (Phase 5)**: Depends on Foundational and can be completed after hidden launcher metadata exists
- **Polish (Phase 6)**: Depends on selected user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on US2 or US3
- **User Story 2 (P1)**: Can start after Foundational; integrates with the launcher behavior from US1 if US1 is already complete
- **User Story 3 (P2)**: Can start after Foundational; status is most useful after US1 metadata and action generation exist

### Within Each User Story

- Tests before implementation
- Launcher command and metadata before CLI output
- Scheduler action registration before reinstall behavior validation
- Status parsing before status display formatting
- Story complete before moving to lower priority work unless tasks are explicitly parallelized

### Parallel Opportunities

- T001 and T002 can run in parallel because they touch separate files.
- T007 and T008 can run in parallel after T003 through T006 are scoped.
- T009, T010, and T011 can run in parallel because they cover different test files.
- T016, T017, and T018 can run in parallel because they cover separate behavior surfaces.
- T023 and T024 can run in parallel because status parsing and command output tests are separate files.
- T029 and T030 can run in parallel because README and quickstart updates are separate files.

## Parallel Execution Examples

### User Story 1

```text
Task: T009 in tests/integration/scheduler/windows-task-scheduler.test.ts
Task: T010 in tests/integration/scheduler/scheduler-lifecycle.test.ts
Task: T011 in tests/unit/scheduler/scheduler-command.test.ts
```

### User Story 2

```text
Task: T016 in tests/unit/scheduler/scheduler-command.test.ts
Task: T017 in tests/integration/scheduler/scheduler-secure-credentials.test.ts
Task: T018 in tests/integration/setup/setup-scheduler-install.test.ts
```

### User Story 3

```text
Task: T023 in tests/unit/scheduler/scheduler-status.test.ts
Task: T024 in tests/unit/scheduler/scheduler-install-config.test.ts
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1 to make scheduled sync invisible.
3. Validate by reinstalling the scheduler and manually starting the task from Windows Task Scheduler.

### Incremental Delivery

1. Add User Story 2 to prove hidden execution preserves normal sync behavior.
2. Add User Story 3 to make status output concise and useful.
3. Complete documentation and full validation in Phase 6.

### Validation Scope

- `npm run build`
- `npm test`
- `npm run lint`
- Manual Windows Task Scheduler start of `MonoLunchMoneySync`
- `mono-lunchmoney scheduler status`

## Notes

- Do not introduce a local transaction database or transaction cursor.
- Do not pass API tokens in scheduler task actions, launcher files, process arguments, console output, or logs.
- Do not install a visible-console fallback if hidden launcher creation fails.
- Preserve existing sync behavior for locks, logs, imports, filters, and notifications.
- Keep status output useful while hiding wrapper internals.
