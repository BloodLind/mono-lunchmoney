# Tasks: Monobank to Lunch Money Sync

**Input**: Design documents from `specs/002-mono-lunch-sync/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Required. The feature specification and constitution require unit and
mocked integration coverage for deterministic idempotency, mapping, config
validation, provider limits, duplicate reruns, locking, logging sanitization,
and scheduler command safety.

**Organization**: Tasks are grouped by user story so each story can be
implemented and verified independently after the foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because files and dependencies do not overlap
- **[Story]**: User story label, such as US1, US2, US3
- All task descriptions include exact repository-relative file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare directories and test scaffolding for the sync feature on top
of the existing TypeScript CLI skeleton.

- [X] T001 Create planned source directories in `src/monobank/`, `src/lunchmoney/`, `src/mapping/`, `src/locking/`, and `src/sync/`
- [X] T002 [P] Create planned test directories in `tests/unit/monobank/`, `tests/unit/lunchmoney/`, `tests/unit/mapping/`, `tests/unit/locking/`, `tests/integration/setup/`, `tests/integration/sync/`, and `tests/integration/backfill/`
- [X] T003 [P] Add reusable provider fixture builders in `tests/fixtures/providers.ts`
- [X] T004 [P] Add reusable config fixture builders in `tests/fixtures/config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts, utilities, and adapters that block all user-story
implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Add provider token resolution tests for missing and present `MONO_TOKEN` and `LUNCHMONEY_TOKEN` in `tests/unit/config/tokens.test.ts`
- [X] T006 [P] Add config writer tests for token-free persisted config in `tests/unit/config/config-writer.test.ts`
- [X] T007 [P] Add external id tests for deterministic output and 75-character maximum in `tests/unit/mapping/external-id.test.ts`
- [X] T008 [P] Add money and local date conversion tests in `tests/unit/utils/money-date.test.ts`
- [X] T009 [P] Add notes builder tests for required keys and 350-character maximum in `tests/unit/mapping/notes-builder.test.ts`
- [X] T010 [P] Add Monobank statement fetcher tests for 31-day window validation, 500-item paging, dedupe, and wait injection in `tests/unit/monobank/statement-fetcher.test.ts`
- [X] T011 [P] Add Lunch Money import chunking and request option tests in `tests/unit/lunchmoney/lunchmoney-v1-client.test.ts`
- [X] T012 [P] Add lock file tests for live lock, stale lock, and release behavior in `tests/unit/locking/lock-file.test.ts`
- [X] T013 Implement provider token resolver in `src/config/tokens.ts`
- [X] T014 Implement config writer with atomic directory creation and no token persistence in `src/config/config.writer.ts`
- [X] T015 Extend config schema validation for enabled mappings and optional scheduler settings in `src/config/config.model.ts`
- [X] T016 [P] Implement Monobank currency code mapping in `src/monobank/currency-map.ts`
- [X] T017 [P] Define Monobank response and statement types in `src/monobank/mono-types.ts`
- [X] T018 [P] Define Lunch Money and budget provider types in `src/lunchmoney/lunchmoney-types.ts` and `src/lunchmoney/budget-provider.ts`
- [X] T019 [P] Implement deterministic external id generation in `src/mapping/external-id.ts`
- [X] T020 [P] Implement money and date utilities in `src/utils/money.ts` and `src/utils/date.ts`
- [X] T021 [P] Implement compact notes builder in `src/mapping/notes-builder.ts`
- [X] T022 Implement lock file acquisition, stale-lock recovery, and release in `src/locking/lock-file.ts`

**Checkpoint**: Provider contracts, config persistence, mapping primitives, and
lock behavior are tested and ready for story work.

---

## Phase 3: User Story 1 - Configure Tracked Accounts (Priority: P1) MVP

**Goal**: A first-time user can run interactive setup, choose Monobank sources,
map them to existing or newly created Lunch Money manual accounts, and save a
sanitized config.

**Independent Test**: With mocked Monobank client info and mocked Lunch Money
assets, run the setup flow twice: once mapping to an existing asset and once
creating a new asset. Verify saved config contains mappings and no tokens.

### Tests for User Story 1

- [X] T023 [P] [US1] Add Monobank client info parsing and source-flattening tests in `tests/unit/monobank/mono-client-info.test.ts`
- [X] T024 [P] [US1] Add Lunch Money asset listing and creation adapter tests in `tests/unit/lunchmoney/lunchmoney-assets.test.ts`
- [X] T025 [P] [US1] Add setup existing-asset integration test with scripted prompt input in `tests/integration/setup/setup-existing-asset.test.ts`
- [X] T026 [P] [US1] Add setup create-asset integration test with scripted prompt input in `tests/integration/setup/setup-create-asset.test.ts`
- [X] T027 [P] [US1] Add setup cancellation and invalid credential tests in `tests/integration/setup/setup-errors.test.ts`

### Implementation for User Story 1

- [X] T028 [US1] Implement Monobank HTTP client `getClientInfo` and source flattening in `src/monobank/mono-client.ts`
- [X] T029 [US1] Implement Lunch Money v1 `listAccounts` and `createAccount` methods in `src/lunchmoney/lunchmoney-v1-client.ts`
- [X] T030 [US1] Implement setup prompt helpers using `readline/promises` in `src/commands/setup.command.ts`
- [X] T031 [US1] Implement account selection, existing asset mapping, and create-new-asset flow in `src/commands/setup.command.ts`
- [X] T032 [US1] Persist setup output through config writer and runtime paths in `src/commands/setup.command.ts`
- [X] T033 [US1] Print sanitized setup summary using masking helpers in `src/commands/setup.command.ts`
- [X] T034 [US1] Document setup behavior and environment-token requirements in `README.md`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Run Safe Manual Sync (Priority: P1)

**Goal**: A saved config can drive non-interactive sync that imports recent
transactions as review-pending Lunch Money transactions without duplicates.

**Independent Test**: With fixture config and mocked recent Monobank
transactions, run sync twice and verify the second run submits deterministic
external ids with no duplicate effective imports while preserving status, tag,
notes, and mapped asset id.

### Tests for User Story 2

- [X] T035 [P] [US2] Add mapper tests for asset id, tag, status, payee fallback, amount, date, notes, and external id in `tests/unit/mapping/mono-to-lunchmoney.mapper.test.ts`
- [X] T036 [P] [US2] Add Monobank statement HTTP tests for auth header, sanitized errors, and response parsing in `tests/unit/monobank/mono-client-statement.test.ts`
- [X] T037 [P] [US2] Add sync runner integration test for one successful account in `tests/integration/sync/sync-success.test.ts`
- [X] T038 [P] [US2] Add sync duplicate-rerun integration test in `tests/integration/sync/sync-duplicate-rerun.test.ts`
- [X] T039 [P] [US2] Add sync partial-account-failure integration test in `tests/integration/sync/sync-partial-failure.test.ts`
- [X] T040 [P] [US2] Add sync lock-held and stale-lock integration tests in `tests/integration/sync/sync-locking.test.ts`
- [X] T041 [P] [US2] Add sync dry-run integration test proving no Lunch Money import call in `tests/integration/sync/sync-dry-run.test.ts`

### Implementation for User Story 2

- [X] T042 [US2] Implement Monobank statement HTTP method in `src/monobank/mono-client.ts`
- [X] T043 [US2] Implement Monobank rate limiter with injectable clock and delay in `src/monobank/mono-rate-limiter.ts`
- [X] T044 [US2] Implement statement window validation, 500-item paging, and dedupe in `src/monobank/statement-fetcher.ts`
- [X] T045 [US2] Implement Lunch Money v1 transaction import and 500-item chunking in `src/lunchmoney/lunchmoney-v1-client.ts`
- [X] T046 [US2] Implement Monobank-to-Lunch Money transaction mapper in `src/mapping/mono-to-lunchmoney.mapper.ts`
- [X] T047 [US2] Implement sync orchestration, lock usage, dry-run handling, and partial failure policy in `src/sync/sync-runner.ts`
- [X] T048 [US2] Wire `mono-lunchmoney sync` to tokens, config loading, sync runner, quiet mode, and exit codes in `src/commands/sync.command.ts`
- [X] T049 [US2] Extend logger success and error append helpers for per-account sync summaries in `src/logging/logger.ts`
- [X] T050 [US2] Document manual sync, dry-run, duplicate behavior, and logs in `README.md`

**Checkpoint**: User Stories 1 and 2 are independently functional and testable.

---

## Phase 5: User Story 3 - Run Daily Background Sync (Priority: P2)

**Goal**: The user can install, inspect, and uninstall a daily Windows scheduled
task that runs quiet sync without exposing credentials.

**Independent Test**: With a fixture config path and fake PowerShell executor,
install scheduler, verify the registered command is `sync --config <path>
--quiet` with no tokens, inspect status, and uninstall.

### Tests for User Story 3

- [X] T051 [P] [US3] Add scheduler install tests for saved config updates and token-free command generation in `tests/unit/scheduler/scheduler-install-config.test.ts`
- [X] T052 [P] [US3] Add scheduler status and uninstall integration tests with fake PowerShell executor in `tests/integration/scheduler/scheduler-lifecycle.test.ts`

### Implementation for User Story 3

- [X] T053 [US3] Persist scheduler enabled settings after install in `src/commands/scheduler.command.ts`
- [X] T054 [US3] Ensure install uses `sync --config <path> --quiet` and token-like argument rejection in `src/scheduler/windows-task-scheduler.ts`
- [X] T055 [US3] Ensure status prints task existence, next run, last run, result code, and sanitized command in `src/commands/scheduler.command.ts`
- [X] T056 [US3] Document scheduler lifecycle and token-free task command in `README.md`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Backfill Historical Transactions (Priority: P3)

**Goal**: The user can import a historical date range split into provider-safe
windows while retaining the same idempotency and import semantics as sync.

**Independent Test**: With fixture config and mocked historical transactions,
run backfill twice for the same range and verify provider windows are valid and
effective imports are duplicate-free.

### Tests for User Story 4

- [X] T057 [P] [US4] Add backfill window splitting tests for inclusive date ranges and 31-day maximum windows in `tests/unit/sync/backfill-windows.test.ts`
- [X] T058 [P] [US4] Add backfill duplicate-rerun integration test in `tests/integration/backfill/backfill-duplicate-rerun.test.ts`
- [X] T059 [P] [US4] Add backfill invalid date range and missing config tests in `tests/integration/backfill/backfill-errors.test.ts`

### Implementation for User Story 4

- [X] T060 [US4] Implement backfill date parsing and provider-safe window splitting in `src/sync/backfill-windows.ts`
- [X] T061 [US4] Extend sync runner to process explicit backfill windows with shared mapping/import/logging in `src/sync/sync-runner.ts`
- [X] T062 [US4] Wire `mono-lunchmoney backfill --from --to` to config, tokens, lock, and sync runner in `src/commands/backfill.command.ts`
- [X] T063 [US4] Document backfill usage and rerun safety in `README.md`

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: User Story 5 - Inspect Safe Configuration and Logs (Priority: P3)

**Goal**: The user can inspect config and logs for troubleshooting without
revealing API tokens, full PANs, full IBANs, or full account numbers.

**Independent Test**: With fixture config and sample sync success/failure log
events, run config display and inspect generated logs to confirm required
information is present and sensitive values are absent.

### Tests for User Story 5

- [X] T064 [P] [US5] Add sanitized config display tests covering Monobank ids, PANs, IBANs, and token-like values in `tests/unit/commands/config-show-sanitization.test.ts`
- [X] T065 [P] [US5] Add log sanitization tests for success and error messages with token-like and account-like values in `tests/unit/logging/sanitized-sync-logs.test.ts`
- [X] T066 [P] [US5] Add config show integration test with real fixture config path in `tests/integration/config/config-show.test.ts`

### Implementation for User Story 5

- [X] T067 [US5] Extend masking helpers for PAN, IBAN, token-like values, and long account identifiers in `src/utils/masking.ts`
- [X] T068 [US5] Update config summary to omit raw Monobank account ids and sensitive fields in `src/config/config.loader.ts`
- [X] T069 [US5] Ensure logger sanitizes all sync success and error entries before writing in `src/logging/logger.ts`
- [X] T070 [US5] Document safe troubleshooting with config show and log locations in `README.md`

**Checkpoint**: User Story 5 is independently functional and testable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation updates across the complete
feature.

- [X] T071 [P] Update feature quickstart with final command outputs and validation notes in `specs/002-mono-lunch-sync/quickstart.md`
- [X] T072 [P] Update package documentation examples for setup, sync, scheduler, backfill, and config show in `tests/unit/docs/readme-examples.test.ts`
- [X] T073 [P] Add end-to-end mocked happy-path coverage from setup through sync in `tests/integration/sync/setup-to-sync.test.ts`
- [X] T074 Run build, test, and lint verification and record any follow-up notes in `specs/002-mono-lunch-sync/quickstart.md`
- [X] T075 Verify no implementation stores imported transaction progress by reviewing config writes in `src/config/config.writer.ts` and sync orchestration in `src/sync/sync-runner.ts`
- [X] T076 Verify scheduler commands and README examples contain no API tokens in `src/scheduler/windows-task-scheduler.ts` and `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1 Setup**: Depends on Phase 2.
- **Phase 4 US2 Manual Sync**: Depends on Phase 2 and can use fixture config, but full product flow depends on US1-created config.
- **Phase 5 US3 Scheduler**: Depends on Phase 2 and is most valuable after US2 because it schedules quiet sync.
- **Phase 6 US4 Backfill**: Depends on Phase 2 and reuses US2 sync runner behavior.
- **Phase 7 US5 Config/Logs**: Depends on Phase 2 and can run alongside US2/US3/US4 once shared logging and config paths exist.
- **Phase 8 Polish**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 Configure Tracked Accounts (P1)**: MVP. No dependency on other stories after foundation.
- **US2 Run Safe Manual Sync (P1)**: Requires foundation; uses config produced by US1 in real usage but can be tested independently with fixture config.
- **US3 Run Daily Background Sync (P2)**: Requires sync command behavior from US2 for end-to-end value.
- **US4 Backfill Historical Transactions (P3)**: Reuses US2 mapping/import/sync runner.
- **US5 Inspect Safe Configuration and Logs (P3)**: Cross-cuts US1/US2 but can be independently tested with fixtures.

### Within Each User Story

- Write story tests before or alongside implementation.
- Define types and adapter contracts before command orchestration.
- Implement provider adapters before workflows that call them.
- Implement core workflow before command wiring.
- Update documentation after command behavior is complete.

### Parallel Opportunities

- Phase 1 tasks T002, T003, and T004 can run in parallel after T001.
- Foundational test tasks T005 through T012 can run in parallel because they touch separate test files.
- Foundational utility tasks T016 through T021 can run in parallel after related tests are drafted.
- US1 tests T023 through T027 can run in parallel; implementation tasks T028 and T029 can run in parallel before setup command wiring.
- US2 tests T035 through T041 can run in parallel; implementation tasks T042 through T046 can run in parallel before T047 and T048.
- US3 tests T051 and T052 can run in parallel before scheduler command updates.
- US4 tests T057 through T059 can run in parallel before backfill command wiring.
- US5 tests T064 through T066 can run in parallel before sanitization implementation.

### Parallel Execution Examples

```powershell
# US1 parallel test drafting
codex task T023
codex task T024
codex task T025
codex task T026
```

```powershell
# US2 parallel adapter and mapper implementation after tests are in place
codex task T042
codex task T043
codex task T045
codex task T046
```

```powershell
# US4 and US5 can proceed in separate workstreams after shared sync/log foundations
codex task T057
codex task T064
```

## Implementation Strategy

### MVP First

Complete Phase 1, Phase 2, and Phase 3 (US1). This delivers interactive setup
and a valid token-free config, which is the minimum trusted base for later sync.

### Incremental Delivery

1. Add US2 to deliver safe manual sync and duplicate-free imports.
2. Add US3 to automate the already-safe sync command through Windows Task Scheduler.
3. Add US4 to reuse the sync pipeline for historical backfill.
4. Add US5 to complete troubleshooting and sanitization guarantees.
5. Finish Phase 8 verification and documentation.

### Validation Gates

- After Phase 2: run `npm run build` and targeted unit tests for config, mapping,
  provider adapters, and locking.
- After US1: run setup integration tests with mocked providers.
- After US2: run sync integration tests twice against the same fixtures.
- After US3: run scheduler command and lifecycle tests with fake PowerShell executor.
- After US4: run backfill range and duplicate-rerun tests.
- After US5 and polish: run `npm run build`, `npm test`, and `npm run lint`.

## Task Summary

- **Total tasks**: 76
- **US1 tasks**: 12
- **US2 tasks**: 16
- **US3 tasks**: 6
- **US4 tasks**: 7
- **US5 tasks**: 7
- **Parallelizable tasks**: 40
- **Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1)

## Format Validation

All executable tasks above use the required checklist format:
`- [ ] T### [P?] [US?] Description with file path`.

