---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Include tests for any touched constitution-governed behavior:
deterministic external ids, money/date mapping, notes length, config validation,
Monobank paging/rate handling, Lunch Money chunking, duplicate reruns, lock
handling, logging sanitization, and scheduler command token safety. Tests for
unrelated documentation-only changes may be marked N/A with rationale.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because files and dependencies do not overlap
- **[Story]**: Which user story this task belongs to, such as US1, US2, US3
- Include exact file paths in descriptions

## Path Conventions

- **Source**: `src/` at repository root
- **Unit tests**: `tests/unit/`
- **Integration tests**: `tests/integration/`
- **Docs**: `README.md` and feature quickstart files under `specs/`

<!--
  The /speckit-tasks command MUST replace sample tasks with concrete tasks based
  on spec.md, plan.md, data-model.md, research.md, and contracts/.
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline TypeScript CLI structure

- [ ] T001 Create TypeScript project skeleton and package scripts
- [ ] T002 Create `src/cli.ts` command entrypoint
- [ ] T003 [P] Configure linting, formatting, and test runner
- [ ] T004 [P] Create baseline README or quickstart instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user stories

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Define config schema/model in `src/config/config.model.ts`
- [ ] T006 Implement config paths, loader, writer, and sanitized display
- [ ] T007 Implement token resolution without command-line token arguments
- [ ] T008 Implement Monobank client and rate limiter interfaces
- [ ] T009 Implement Lunch Money `BudgetProvider` and v1 client interfaces
- [ ] T010 Implement mapping utilities for external ids, notes, date, and money
- [ ] T011 Implement lock file handling for non-overlapping sync
- [ ] T012 Implement logger with token and account identifier sanitization
- [ ] T013 [P] Add unit tests for config validation and mapping invariants

**Checkpoint**: Foundation ready; user story implementation can begin.

---

## Phase 3: User Story 1 - [Title] (Priority: P1) MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1

- [ ] T014 [P] [US1] Add unit or integration tests for [behavior] in tests/
- [ ] T015 [P] [US1] Add duplicate-rerun coverage when imports are touched

### Implementation for User Story 1

- [ ] T016 [US1] Implement [command/service] in `src/[path]`
- [ ] T017 [US1] Add validation and error handling
- [ ] T018 [US1] Add readable, sanitized logging

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2

- [ ] T019 [P] [US2] Add unit or integration tests for [behavior] in tests/

### Implementation for User Story 2

- [ ] T020 [US2] Implement [command/service] in `src/[path]`
- [ ] T021 [US2] Integrate with existing adapters or mapping utilities
- [ ] T022 [US2] Add validation and error handling

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3

- [ ] T023 [P] [US3] Add unit or integration tests for [behavior] in tests/

### Implementation for User Story 3

- [ ] T024 [US3] Implement [command/service] in `src/[path]`
- [ ] T025 [US3] Add validation, logging, and error handling

**Checkpoint**: All selected user stories are independently functional.

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Update README and troubleshooting notes
- [ ] TXXX [P] Add or update mocked API integration tests
- [ ] TXXX Verify scheduler command contains no API tokens
- [ ] TXXX Verify `config show` output is sanitized
- [ ] TXXX Run quickstart or manual smoke validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion; blocks user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on selected user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational; may integrate with US1
- **User Story 3 (P3)**: Can start after Foundational; may integrate with US1/US2

### Within Each User Story

- Tests for touched constitution-governed behavior before or alongside code
- Models and schemas before services
- Adapters before workflows that call external APIs
- Core implementation before scheduler or CLI integration
- Story complete before moving to lower priority work unless explicitly parallelized

### Parallel Opportunities

- Tasks marked [P] can run in parallel when they touch different files
- Unit tests for independent utilities can run in parallel
- Different user stories can be worked on in parallel after Foundational completes

## Notes

- Avoid vague tasks and hidden dependencies
- Avoid introducing a local transaction database or transaction cursor
- Avoid command-line API tokens
- Keep adapter boundaries intact for Lunch Money v1 and future v2 migration
- Commit after each task or logical group when using git automation
