# Tasks: Node CLI Project Initialization

**Input**: Design documents from `/specs/001-node-cli-init/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-contract.md, quickstart.md

**Tests**: Required by plan for command discovery, runtime paths, scheduler token safety, status parsing, non-interactive exits, and sanitized failure records.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because files and dependencies do not overlap
- **[Story]**: Which user story this task belongs to, such as US1, US2, US3
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Node/TypeScript CLI package and repository scaffolding.

- [X] T001 Create npm package metadata, scripts, engine range, package files allowlist, and `mono-lunchmoney` bin entry in `package.json`
- [X] T002 Create TypeScript build configuration for CLI output in `tsconfig.json`
- [X] T003 [P] Create Vitest configuration and shared test setup in `vitest.config.ts` and `tests/setup.ts`
- [X] T004 [P] Create ESLint and Prettier configuration in `eslint.config.js` and `.prettierrc.json`
- [X] T005 [P] Create Node/TypeScript ignore rules in `.gitignore`, `.npmignore`, and `.prettierignore`
- [X] T006 Create initial CLI entrypoint placeholder with executable shebang in `src/cli.ts`
- [X] T007 [P] Create README skeleton with install, command, scheduler, and security sections in `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared command, validation, path, logging, and sanitization primitives needed by all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Define command metadata and exit code constants in `src/cli/command-registry.ts`
- [X] T009 Define runtime config and scheduler schemas in `src/config/config.model.ts`
- [X] T010 Implement user-profile runtime path resolution in `src/config/paths.ts`
- [X] T011 Implement config loader and sanitized config summary helpers in `src/config/config.loader.ts`
- [X] T012 Implement runtime directory creation helpers that only create folders on write in `src/config/runtime-files.ts`
- [X] T013 Implement sensitive value masking and token-like argument detection in `src/utils/masking.ts`
- [X] T014 Implement sanitized logger and failure record writer in `src/logging/logger.ts`
- [X] T015 Implement shared CLI error handling and non-interactive exit mapping in `src/cli/errors.ts`
- [X] T016 [P] Add unit tests for runtime path resolution in `tests/unit/config/paths.test.ts`
- [X] T017 [P] Add unit tests for config schema validation and sanitized summaries in `tests/unit/config/config-loader.test.ts`
- [X] T018 [P] Add unit tests for masking and token-like argument detection in `tests/unit/utils/masking.test.ts`
- [X] T019 [P] Add unit tests for sanitized logger failure records in `tests/unit/logging/logger.test.ts`

**Checkpoint**: Foundation ready; user story implementation can begin.

---

## Phase 3: User Story 1 - Initialize Installable CLI Project (Priority: P1) MVP

**Goal**: Users can install the package and run `mono-lunchmoney --help` to discover required commands without credentials or config.

**Independent Test**: Install/link the package, run `mono-lunchmoney --help`, and verify setup, sync, scheduler, backfill, and config commands are listed.

### Tests for User Story 1

- [X] T020 [P] [US1] Add CLI help and version contract tests in `tests/unit/cli/help.test.ts`
- [X] T021 [P] [US1] Add package bin metadata test in `tests/unit/cli/package-bin.test.ts`
- [X] T022 [P] [US1] Add placeholder command discovery tests in `tests/unit/cli/command-discovery.test.ts`

### Implementation for User Story 1

- [X] T023 [US1] Implement Commander program factory with global help/version in `src/cli/program.ts`
- [X] T024 [US1] Register setup, sync, backfill, scheduler, and config command groups in `src/cli.ts`
- [X] T025 [US1] Implement setup command placeholder behavior in `src/commands/setup.command.ts`
- [X] T026 [US1] Implement sync command shell options and missing-config failure behavior in `src/commands/sync.command.ts`
- [X] T027 [US1] Implement backfill command placeholder and date option parsing shell in `src/commands/backfill.command.ts`
- [X] T028 [US1] Wire package bin entry to built CLI output and executable permissions in `package.json`

**Checkpoint**: `mono-lunchmoney --help` and `mono-lunchmoney --version` are functional after build/link.

---

## Phase 4: User Story 2 - Provide First-Run Project Defaults (Priority: P1)

**Goal**: Commands resolve user-level config, log, error log, and lock paths, and config display is safe before setup exists.

**Independent Test**: Run `mono-lunchmoney config show` on a fresh profile and verify it reports default paths without secrets or transaction state.

### Tests for User Story 2

- [X] T029 [P] [US2] Add config show no-config behavior tests in `tests/unit/commands/config-show.test.ts`
- [X] T030 [P] [US2] Add runtime directory creation-on-write tests in `tests/unit/config/runtime-files.test.ts`
- [X] T031 [P] [US2] Add explicit `--config` override tests in `tests/unit/cli/config-option.test.ts`

### Implementation for User Story 2

- [X] T032 [US2] Implement `config show` command output in `src/commands/config.command.ts`
- [X] T033 [US2] Add global `--config` path handling for commands that need config in `src/cli/program.ts`
- [X] T034 [US2] Integrate runtime path display and no-config messaging in `src/commands/config.command.ts`
- [X] T035 [US2] Ensure config display and path resolution create no imported transaction state in `src/config/runtime-files.ts`

**Checkpoint**: `mono-lunchmoney config show` works before setup and prints only sanitized runtime information.

---

## Phase 5: User Story 3 - Install Background Schedule (Priority: P2)

**Goal**: Windows users can install, inspect, and uninstall a daily background sync task that invokes quiet sync without credentials in the registered command.

**Independent Test**: Generate/install a daily schedule, inspect the registered command for `sync --quiet --config`, verify no tokens, then uninstall it.

### Tests for User Story 3

- [X] T036 [P] [US3] Add scheduler time and task name validation tests in `tests/unit/scheduler/scheduler-schema.test.ts`
- [X] T037 [P] [US3] Add scheduler command token-safety tests in `tests/unit/scheduler/scheduler-command.test.ts`
- [X] T038 [P] [US3] Add scheduler status parsing tests in `tests/unit/scheduler/scheduler-status.test.ts`
- [X] T039 [P] [US3] Add mocked scheduler install/status/uninstall integration tests in `tests/integration/scheduler/windows-task-scheduler.test.ts`

### Implementation for User Story 3

- [X] T040 [US3] Implement scheduler command construction and token rejection in `src/scheduler/windows-task-scheduler.ts`
- [X] T041 [US3] Implement PowerShell task registration, status query, and unregister wrappers in `src/scheduler/windows-task-scheduler.ts`
- [X] T042 [US3] Implement `scheduler install`, `scheduler status`, and `scheduler uninstall` CLI handlers in `src/commands/scheduler.command.ts`
- [X] T043 [US3] Add non-Windows scheduler failure messaging and exit mapping in `src/commands/scheduler.command.ts`
- [X] T044 [US3] Integrate scheduler defaults from config schema into command options in `src/config/config.model.ts`

**Checkpoint**: Scheduler commands are non-interactive and the registered command contains no API tokens.

---

## Phase 6: User Story 4 - Package and Document Distribution (Priority: P2)

**Goal**: Maintainers can create an installable package and users can install/run it using documented steps.

**Independent Test**: Follow README installation and release steps from a clean environment, then run help and scheduler status without undocumented steps.

### Tests for User Story 4

- [X] T045 [P] [US4] Add package contents and `npm pack` validation test in `tests/integration/package/package-contents.test.ts`
- [X] T046 [P] [US4] Add README command example consistency test in `tests/unit/docs/readme-examples.test.ts`

### Implementation for User Story 4

- [X] T047 [US4] Complete README install, local development, command usage, scheduler, troubleshooting, and security sections in `README.md`
- [X] T048 [US4] Add license and package metadata documentation references in `LICENSE` and `package.json`
- [X] T049 [US4] Add release/package validation script in `scripts/validate-package.mjs`
- [X] T050 [US4] Add package validation npm script in `package.json`

**Checkpoint**: `npm pack` produces an installable package without local runtime files or secrets.

---

## Phase 7: User Story 5 - Surface Background Failures for Follow-Up Notifications (Priority: P3)

**Goal**: Background failures are discoverable through status/logs, and active notifications are documented as a separate follow-up.

**Independent Test**: Simulate a failed quiet sync with a missing config path and verify non-zero exit, sanitized error log, and no active notification behavior.

### Tests for User Story 5

- [X] T051 [P] [US5] Add quiet sync failure log tests in `tests/unit/commands/sync-failure.test.ts`
- [X] T052 [P] [US5] Add failure record sanitization tests in `tests/unit/logging/failure-record.test.ts`
- [X] T053 [P] [US5] Add notification follow-up boundary documentation test in `tests/unit/docs/notification-followup.test.ts`

### Implementation for User Story 5

- [X] T054 [US5] Write sync missing-config failures to sanitized error log in `src/commands/sync.command.ts`
- [X] T055 [US5] Include failure status fields in scheduler status output in `src/commands/scheduler.command.ts`
- [X] T056 [US5] Document active background notifications as a separate follow-up in `README.md`
- [X] T057 [US5] Add notification follow-up note to `specs/001-node-cli-init/quickstart.md`

**Checkpoint**: Failed background sync information is visible through status/logs and no active notification is implemented.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, quickstart alignment, and security checks across all user stories.

- [X] T058 [P] Run and document quickstart validation results in `specs/001-node-cli-init/quickstart.md`
- [X] T059 [P] Add command contract traceability notes in `specs/001-node-cli-init/contracts/cli-contract.md`
- [X] T060 Run full test suite and build validation via npm scripts documented in `package.json`
- [X] T061 Verify generated package and scheduler command contain no API tokens in `scripts/validate-package.mjs`
- [X] T062 Update task completion evidence and remaining follow-ups in `specs/001-node-cli-init/tasks.md`

---

## Dependencies & Execution Order

## Completion Evidence

- Implemented the Node/TypeScript CLI package with `mono-lunchmoney` bin output
  in `dist/cli.js`.
- Implemented command discovery, first-run config display, Windows scheduler
  install/status/uninstall shell, package validation, and quiet sync failure
  logging.
- Documented active background notifications as a separate follow-up boundary in
  README and quickstart.
- Validation on 2026-05-16: `npm run lint`, `npm run check`,
  `node dist\cli.js --help`, `node dist\cli.js config show`, and
  `node dist\cli.js scheduler status` passed.

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks user stories.
- **User Story 1 and User Story 2 (P1)**: Depend on Foundational completion. US1 and US2 can be implemented independently after shared foundations, but US1 is the MVP.
- **User Story 3 (P2)**: Depends on US1 command registration and US2 runtime paths.
- **User Story 4 (P2)**: Depends on US1 command registration; can run alongside US3 after US1.
- **User Story 5 (P3)**: Depends on US2 logging/runtime paths and US3 status surface.
- **Polish (Phase 8)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **US1 Initialize Installable CLI Project**: MVP; no dependency on other stories after Phase 2.
- **US2 Provide First-Run Project Defaults**: No dependency on other stories after Phase 2.
- **US3 Install Background Schedule**: Requires US1 CLI command shell and US2 config path resolution.
- **US4 Package and Document Distribution**: Requires US1 package/command shell.
- **US5 Surface Background Failures**: Requires US2 logger/runtime paths and US3 scheduler status command.

### Within Each User Story

- Write tests before implementation tasks in the same story.
- Implement schemas/models before services that consume them.
- Implement command construction before invoking PowerShell scheduler wrappers.
- Complete each story checkpoint before moving to lower-priority work.

## Parallel Opportunities

- T003, T004, T005, and T007 can run in parallel after T001-T002 are understood.
- T016-T019 can run in parallel after T008-T015 interfaces are defined.
- T020-T022 can run in parallel for US1 test coverage.
- T029-T031 can run in parallel for US2 test coverage.
- T036-T039 can run in parallel for scheduler test coverage.
- T045-T046 can run in parallel for packaging/docs validation.
- T051-T053 can run in parallel for failure visibility coverage.
- T058-T059 can run in parallel during polish.

## Parallel Example: User Story 3

```bash
Task: "T036 [P] [US3] Add scheduler time and task name validation tests in tests/unit/scheduler/scheduler-schema.test.ts"
Task: "T037 [P] [US3] Add scheduler command token-safety tests in tests/unit/scheduler/scheduler-command.test.ts"
Task: "T038 [P] [US3] Add scheduler status parsing tests in tests/unit/scheduler/scheduler-status.test.ts"
Task: "T039 [P] [US3] Add mocked scheduler install/status/uninstall integration tests in tests/integration/scheduler/windows-task-scheduler.test.ts"
```

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 so `mono-lunchmoney --help` and command discovery work from the installed package.
3. Validate package bin metadata and help output.

### Incremental Delivery

1. Add US2 runtime paths and safe config display.
2. Add US3 Windows scheduler install/status/uninstall.
3. Add US4 packaging and documentation hardening.
4. Add US5 failure visibility and notification follow-up boundary.

### Validation Gates

- No task may introduce token CLI arguments.
- No task may create a local transaction database or imported transaction cursor.
- Scheduler commands must be validated for token safety before registration.
- Every completed task must be marked `[X]` in this file by the implementer.
