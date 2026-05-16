# Tasks: Secure Token Storage

**Input**: Design documents from `/specs/004-secure-token-storage/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required for this feature because it changes secret handling, non-interactive command authentication, setup behavior, scheduler safety, and sanitized output. Tests are listed before implementation tasks in each user story.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because files and dependencies do not overlap
- **[Story]**: Which user story this task belongs to, such as US1, US2, US3
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the credential feature file layout and reusable test scaffolding without changing runtime behavior yet.

- [X] T001 Create credential fixture builders for saved/missing/inaccessible provider states in `tests/fixtures/credentials.ts`
- [X] T002 [P] Create credential integration command harness helpers in `tests/integration/credentials/credentials-test-helpers.ts`
- [X] T003 [P] Add provider token sample constants for leak-detection assertions in `tests/fixtures/credentials.ts`
- [X] T004 [P] Add a placeholder credential module barrel export plan in `src/credentials/credential-types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared credential storage boundary and token resolution infrastructure required by all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

### Tests

- [X] T005 [P] Add provider credential type and status tests in `tests/unit/credentials/credential-types.test.ts`
- [X] T006 [P] Add credential store contract tests for save/read/remove/status failures in `tests/unit/credentials/credential-store.test.ts`
- [X] T007 [P] Add protected credential store DPAPI/encrypted-record behavior tests with mocked process execution in `tests/unit/credentials/protected-credential-store.test.ts`
- [X] T008 [P] Add token resolver tests for protected-storage-first, environment compatibility, missing credentials, and inaccessible credentials in `tests/unit/config/tokens.test.ts`
- [X] T009 [P] Add token redaction tests for credential errors and known token values in `tests/unit/utils/masking.test.ts`

### Implementation

- [X] T010 Define provider, status, source, operation result, and runtime token types in `src/credentials/credential-types.ts`
- [X] T011 Implement the credential store interface, provider validation helpers, and safe status/result helpers in `src/credentials/credential-store.ts`
- [X] T012 Implement user-scoped protected credential persistence with no plaintext fallback in `src/credentials/protected-credential-store.ts`
- [X] T013 Add credential file/path resolution for protected records in `src/config/runtime-files.ts`
- [X] T014 Update token sanitization helpers for credential-aware redaction in `src/utils/masking.ts`
- [X] T015 Refactor `resolveProviderTokens` to use protected storage first and environment compatibility second in `src/config/tokens.ts`
- [X] T016 Replace persistent environment-writing helpers with protected credential save/read abstractions in `src/config/tokens.ts`
- [X] T017 Export credential module APIs for command usage in `src/credentials/credential-store.ts`

**Checkpoint**: Credential storage and runtime token resolution exist behind a shared interface; user stories can now integrate it.

---

## Phase 3: User Story 1 - Save Tokens Securely During Setup (Priority: P1) MVP

**Goal**: Setup guides the user to obtain tokens, validates entered or migrated tokens, saves reusable credentials in protected storage, and lets sync/backfill reuse them non-interactively.

**Independent Test**: From a clean user profile with no saved credentials, run setup with entered tokens, verify config contains no tokens, then run sync/backfill using only saved credentials and no prompts.

### Tests for User Story 1

- [X] T018 [P] [US1] Add setup test for entering missing tokens and saving them to protected storage in `tests/integration/setup/setup-secure-token-storage.test.ts`
- [X] T019 [P] [US1] Add setup test for using existing protected credentials without prompting for token input in `tests/integration/setup/setup-secure-token-storage.test.ts`
- [X] T020 [P] [US1] Add setup migration test for environment tokens saved into protected storage without config leakage in `tests/integration/setup/setup-token-migration.test.ts`
- [X] T021 [P] [US1] Add sync integration test proving saved credentials authenticate without environment variables or prompts in `tests/integration/sync/setup-to-sync-secure-credentials.test.ts`
- [X] T022 [P] [US1] Add backfill integration test proving saved credentials authenticate without environment variables or prompts in `tests/integration/backfill/backfill-secure-credentials.test.ts`

### Implementation for User Story 1

- [X] T023 [US1] Extend setup dependencies with credential store injection and token source reporting in `src/commands/setup.command.ts`
- [X] T024 [US1] Refactor setup token collection to read protected credentials, then environment compatibility, then prompt with token links in `src/commands/setup.command.ts`
- [X] T025 [US1] Defer credential persistence until Monobank and Lunch Money validation succeeds in `src/commands/setup.command.ts`
- [X] T026 [US1] Save validated Monobank and Lunch Money tokens to protected storage by default with a setup-only temporary option in `src/commands/setup.command.ts`
- [X] T027 [US1] Update setup summary to show credential source labels without token values in `src/commands/setup.command.ts`
- [X] T028 [US1] Inject protected credential resolution into sync command construction in `src/commands/sync.command.ts`
- [X] T029 [US1] Inject protected credential resolution into backfill command construction in `src/commands/backfill.command.ts`
- [X] T030 [US1] Update setup help text from Windows user environment storage to protected credential storage in `src/commands/help.command.ts`
- [X] T031 [US1] Update setup token onboarding tests to expect protected storage prompts and no environment-save wording in `tests/integration/setup/setup-token-onboarding.test.ts`

**Checkpoint**: User Story 1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Prevent Plain Reading Or Accidental Exposure (Priority: P1)

**Goal**: Config display, logs, scheduler output, notifications, and runtime files never expose full provider token values, and protected storage failures do not create plaintext fallback files.

**Independent Test**: Save credentials, inspect config/show output/logs/scheduler command/runtime files with known sample token values, and verify zero full-token matches while inaccessible storage fails closed.

### Tests for User Story 2

- [X] T032 [P] [US2] Add config show test proving credential presence is displayed without token values in `tests/integration/config/config-secure-credentials.test.ts`
- [X] T033 [P] [US2] Add scheduler command/status leak-detection test with known token values in `tests/integration/scheduler/scheduler-secure-credentials.test.ts`
- [X] T034 [P] [US2] Add logging leak-detection test for credential failures and provider validation failures in `tests/unit/logging/credential-sanitization.test.ts`
- [X] T035 [P] [US2] Add notification leak-detection test for credential-related sync/backfill failures in `tests/integration/notifications/credential-failure-notification.test.ts`
- [X] T036 [P] [US2] Add protected-storage-unavailable fail-closed test proving no plaintext token file is written in `tests/unit/credentials/protected-credential-store.test.ts`
- [X] T037 [P] [US2] Add config writer regression test proving `config.json` never serializes provider tokens in `tests/unit/config/config-writer.test.ts`

### Implementation for User Story 2

- [X] T038 [US2] Add safe credential presence fields to sanitized config output in `src/commands/config.command.ts`
- [X] T039 [US2] Ensure runtime file listing includes only encrypted/protected credential record paths and never token values in `src/config/runtime-files.ts`
- [X] T040 [US2] Route credential read/save/remove errors through sanitized CLI errors in `src/credentials/protected-credential-store.ts`
- [X] T041 [US2] Ensure scheduler install and status command generation remains token-free with saved credentials in `src/scheduler/windows-task-scheduler.ts`
- [X] T042 [US2] Sanitize credential-related sync/backfill failure messages before logs and notifications in `src/sync/sync-runner.ts`
- [X] T043 [US2] Update security help to describe protected storage, same-user scheduler reuse, and no plaintext fallback in `src/commands/help.command.ts`
- [X] T044 [US2] Remove user-facing guidance that recommends persistent token environment variables as the setup outcome in `README.md`

**Checkpoint**: User Stories 1 and 2 both work independently and satisfy the core P1 security requirements.

---

## Phase 5: User Story 3 - Manage Saved Tokens Safely (Priority: P2)

**Goal**: Users can inspect credential presence, replace tokens after validation, and remove saved credentials without exposing token values or editing files manually.

**Independent Test**: Save credentials, run `credentials status`, replace one provider token, remove all credentials, then verify sync/backfill fail clearly without prompting.

### Tests for User Story 3

- [X] T045 [P] [US3] Add credentials status integration test with saved, missing, environment, and inaccessible provider states in `tests/integration/credentials/credentials-status.test.ts`
- [X] T046 [P] [US3] Add credentials set integration test for all providers, single-provider replacement, validation-before-save, and no CLI token options in `tests/integration/credentials/credentials-set.test.ts`
- [X] T047 [P] [US3] Add credentials remove integration test for provider/all removal, confirmation, and `--yes` behavior in `tests/integration/credentials/credentials-remove.test.ts`
- [X] T048 [P] [US3] Add command discovery and help tests for the credentials command group in `tests/unit/cli/command-discovery.test.ts`
- [X] T049 [P] [US3] Add non-interactive failure test after credential removal in `tests/integration/sync/sync-missing-secure-credentials.test.ts`

### Implementation for User Story 3

- [X] T050 [US3] Implement `credentials status`, `credentials set`, and `credentials remove` command handlers in `src/commands/credentials.command.ts`
- [X] T051 [US3] Register the credentials command in the CLI entrypoint in `src/cli.ts`
- [X] T052 [US3] Add `credentials` to command registry metadata in `src/cli/command-registry.ts`
- [X] T053 [US3] Add detailed help topic for credential status, set, remove, rotation, and removal in `src/commands/help.command.ts`
- [X] T054 [US3] Validate credential replacement against Monobank/Lunch Money before saving in `src/commands/credentials.command.ts`
- [X] T055 [US3] Implement confirmation and `--yes` removal behavior without modifying account mappings in `src/commands/credentials.command.ts`
- [X] T056 [US3] Add credential command output formatting with aligned status rows and sanitized messages in `src/commands/credentials.command.ts`

**Checkpoint**: All selected user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, packaging, and full regression validation across the completed feature.

- [X] T057 [P] Update secure token setup, rotation, removal, and scheduler reuse instructions in `README.md`
- [X] T058 [P] Update quickstart verification notes for final command names and output in `specs/004-secure-token-storage/quickstart.md`
- [X] T059 [P] Update package/global install expectations for the new credentials command in `tests/integration/package/global-install.test.ts`
- [X] T060 Run TypeScript build validation with `npm run build` and record any required fixes in `specs/004-secure-token-storage/tasks.md`
- [X] T061 Run unit and integration tests with `npm test` and record any required fixes in `specs/004-secure-token-storage/tasks.md`
- [X] T062 Run lint validation with `npm run lint` and record any required fixes in `specs/004-secure-token-storage/tasks.md`
- [X] T063 Search repository docs and source for sample token values and deprecated persistent environment-save wording in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2; this is the MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and should be completed before release because it verifies the P1 exposure protections.
- **User Story 3 (Phase 5)**: Depends on Phase 2; can be implemented after the P1 stories or in parallel with US2 if command files are coordinated.
- **Polish (Phase 6)**: Depends on the selected user stories being complete.

### User Story Dependencies

- **US1 Save Tokens Securely During Setup**: Can start after Foundational; does not depend on US2 or US3.
- **US2 Prevent Plain Reading Or Accidental Exposure**: Can start after Foundational; integrates best after US1 has saved credentials to inspect.
- **US3 Manage Saved Tokens Safely**: Can start after Foundational; uses the same credential store as US1 and does not require setup changes beyond shared token validation helpers.

### Within Each User Story

- Tests come before or alongside implementation for changed credential behavior.
- Credential types and store interface must precede setup, config, and credential command integration.
- Token resolver changes must precede sync/backfill non-interactive reuse.
- CLI command registration must follow command implementation.
- Sanitization changes must be verified before release-facing docs and package tests.

---

## Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel after T001 because they touch separate test helper concerns.
- **Phase 2**: T005-T009 can run in parallel; T010-T012 should then land before T015-T017.
- **US1**: T018-T022 can run in parallel because they add separate integration tests; T028 and T029 can run in parallel after T015 is complete.
- **US2**: T032-T037 can run in parallel; T038, T041, and T042 touch independent command/service areas after the tests exist.
- **US3**: T045-T049 can run in parallel; T051-T053 can run in parallel after T050 creates the command module.
- **Polish**: T057-T059 can run in parallel before validation tasks T060-T062.

### Parallel Example: US1

```text
Task: T018 Add setup secure save test in tests/integration/setup/setup-secure-token-storage.test.ts
Task: T021 Add sync secure credentials test in tests/integration/sync/setup-to-sync-secure-credentials.test.ts
Task: T022 Add backfill secure credentials test in tests/integration/backfill/backfill-secure-credentials.test.ts
```

### Parallel Example: US2

```text
Task: T032 Add config leak-detection test in tests/integration/config/config-secure-credentials.test.ts
Task: T033 Add scheduler leak-detection test in tests/integration/scheduler/scheduler-secure-credentials.test.ts
Task: T035 Add notification leak-detection test in tests/integration/notifications/credential-failure-notification.test.ts
```

### Parallel Example: US3

```text
Task: T045 Add credentials status tests in tests/integration/credentials/credentials-status.test.ts
Task: T046 Add credentials set tests in tests/integration/credentials/credentials-set.test.ts
Task: T047 Add credentials remove tests in tests/integration/credentials/credentials-remove.test.ts
```

---

## Implementation Strategy

### MVP First

Complete Phase 1, Phase 2, and Phase 3. This delivers protected setup saving and non-interactive sync/backfill reuse, which is the minimum usable secure credential path.

### Security Release Gate

Complete Phase 4 before shipping. US2 is P1 because it proves the new storage model does not leak tokens through config, logs, scheduler output, notifications, or plaintext fallback files.

### Incremental Management

Complete Phase 5 after the P1 path works. This adds operational token rotation/removal without changing the already-tested setup and sync authentication path.

### Validation

Finish Phase 6 with build, test, lint, and manual repository leak checks. No task in this feature should introduce a local transaction database, transaction cursor, CLI token argument, or plaintext token config field.

