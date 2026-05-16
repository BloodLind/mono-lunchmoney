# Tasks: Ignore Transfer Transactions

**Input**: Design documents from `/specs/005-ignore-transfer-transactions/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Required because this feature touches config validation, setup flow, non-interactive sync/backfill behavior, logging safety, and stateless transaction import behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because files and dependencies do not overlap
- **[Story]**: Which user story this task belongs to, such as US1, US2, US3
- Every task includes exact file paths for the intended edit or verification target

## Phase 1: Setup (Shared Test Fixtures)

**Purpose**: Prepare reusable fixtures for ignored transfer source scenarios.

- [X] T001 [P] Add ignored transfer source fixture helpers in `tests/fixtures/config.ts`
- [X] T002 [P] Add Monobank source and statement fixture variants with IBAN, masked PAN, and counterparty data in `tests/fixtures/providers.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the shared config and matching primitives used by setup, config display, sync, and backfill.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Extend ignored transfer source schema and exported types in `src/config/config.model.ts`
- [X] T004 Implement enabled ignored source and syncable mapping helpers in `src/config/config.model.ts`
- [X] T005 Add sanitized ignored transfer source summary fields without raw hashes or full identifiers in `src/config/config.loader.ts`
- [X] T006 Implement ignored transfer matching primitives for counterparty IBAN hash, masked PAN, and ambiguous non-match behavior in `src/sync/ignored-transactions.ts`
- [X] T007 [P] Add unit tests for ignored transfer source schema defaults, invalid `ibanSha256`, and syncable mapping helpers in `tests/unit/config/config-loader.test.ts`

**Checkpoint**: Config can represent ignored transfer sources safely and matching can be tested without CLI flows.

---

## Phase 3: User Story 1 - Configure Ignored Transfer Sources During Setup (Priority: P1) MVP

**Goal**: A user can choose ignored transfer sources during setup separately from choosing Lunch Money import mappings.

**Independent Test**: Complete setup with at least two Monobank sources, select one as an ignored transfer source and another as an imported mapping, then verify saved config and setup summary separate ignored sources from mappings without exposing sensitive identifiers.

### Tests for User Story 1

- [X] T008 [P] [US1] Add setup integration test for separate import and ignored-transfer choices in `tests/integration/setup/setup-ignored-transfer-sources.test.ts`
- [X] T009 [P] [US1] Add setup integration test proving skipped-but-not-ignored sources are not saved as ignored transfer sources in `tests/integration/setup/setup-ignored-transfer-choices.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Update setup prompts to ask import tracking and ignored transfer source selection as separate choices in `src/commands/setup.command.ts`
- [X] T011 [US1] Update ignored source persistence to store masked PAN and hashed IBAN matcher data only in `src/commands/setup.command.ts`
- [X] T012 [US1] Update setup saved summary wording to show `Ignored Transfer Sources` separately from `Mappings` in `src/commands/setup.command.ts`
- [X] T013 [US1] Ensure setup summary sanitizes ignored source display names, account ids, PANs, and IBANs in `src/commands/setup.command.ts`

**Checkpoint**: User Story 1 is independently functional and testable through setup output and saved config.

---

## Phase 4: User Story 2 - Exclude Transfers Involving Ignored Sources (Priority: P1)

**Goal**: Sync and backfill exclude transactions on imported accounts when those transactions confidently match an enabled ignored transfer source, while unrelated transactions still import normally.

**Independent Test**: Configure account A as an ignored transfer source and account B as imported, then sync a statement for account B with one transfer from account A and one unrelated purchase. Verify only the unrelated purchase is submitted to Lunch Money and the skipped count is reported.

### Tests for User Story 2

- [X] T014 [P] [US2] Add matcher unit tests for counterparty IBAN hash matches, masked PAN matches, disabled ignored sources, and ambiguous text non-matches in `tests/unit/sync/ignored-transactions.test.ts`
- [X] T015 [P] [US2] Add sync runner test for ignored transfer exclusion and unrelated transaction import in `tests/unit/sync/ignored-related-transactions.test.ts`
- [X] T016 [P] [US2] Add sync runner test for all-fetched-transactions-excluded reporting with zero eligible imports in `tests/unit/sync/ignored-related-transactions-all-excluded.test.ts`
- [X] T017 [P] [US2] Add backfill integration test proving ignored transfer filtering applies to backfill windows in `tests/integration/backfill/backfill-ignored-transfer-sources.test.ts`

### Implementation for User Story 2

- [X] T018 [US2] Return deterministic ignored transfer match details and reasons from `src/sync/ignored-transactions.ts`
- [X] T019 [US2] Apply ignored transfer filtering before transaction mapping in `src/sync/sync-runner.ts`
- [X] T020 [US2] Add ignored transfer skipped counts to account results and sanitized sync logs in `src/sync/sync-runner.ts`
- [X] T021 [US2] Ensure backfill uses the shared sync runner filtering path without separate ignored-transfer logic in `src/commands/backfill.command.ts`
- [X] T022 [US2] Preserve Lunch Money mapping semantics for non-excluded transactions in `src/mapping/mono-to-lunchmoney.mapper.ts`

**Checkpoint**: User Story 2 is independently functional and testable through mocked sync/backfill runs.

---

## Phase 5: User Story 3 - Review And Adjust Ignore Rules (Priority: P2)

**Goal**: A user can inspect ignored transfer sources safely and rerun setup to adjust the list when account usage changes.

**Independent Test**: Show config, verify ignored transfer sources are visible with masked identifiers, rerun setup to change the ignored list, and verify the next sync uses the updated list.

### Tests for User Story 3

- [X] T023 [P] [US3] Add config show sanitization test for ignored transfer source summaries in `tests/unit/commands/config-show-sanitization.test.ts`
- [X] T024 [P] [US3] Add setup reconfigure test proving changed ignored transfer selections replace the old list in `tests/integration/setup/setup-reconfigure.test.ts`
- [X] T025 [P] [US3] Add sync test proving an updated ignored transfer list changes later filtering behavior in `tests/integration/sync/setup-to-sync.test.ts`

### Implementation for User Story 3

- [X] T026 [US3] Update `config show` sanitized output to list ignored transfer sources separately with `hasIbanMatcher` and masked account ids in `src/config/config.loader.ts`
- [X] T027 [US3] Ensure setup reconfigure writes the current ignored transfer source selection and removes unselected stale ignored sources in `src/commands/setup.command.ts`

**Checkpoint**: User Story 3 is independently functional and testable through config display, setup reconfigure, and a later sync run.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish user-facing docs and full verification for the feature.

- [X] T028 [P] Document the ignored transfer source setup and safety behavior in `README.md`
- [X] T029 [P] Update manual validation steps for ignored transfer filtering in `specs/005-ignore-transfer-transactions/quickstart.md`
- [X] T030 Run `npm run build` and fix any TypeScript errors in `src/sync/ignored-transactions.ts`
- [X] T031 Run `npm test` and resolve failing ignored-transfer related tests in `tests/unit/sync/ignored-transactions.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1 fixtures; blocks user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2
- **User Story 2 (Phase 4)**: Depends on Phase 2; can run in parallel with US1 after the shared config/matcher primitives exist, but benefits from US1 setup config shape
- **User Story 3 (Phase 5)**: Depends on US1 for setup reconfigure behavior and US2 for sync behavior
- **Polish (Phase 6)**: Depends on selected user stories being complete

### User Story Dependencies

- **US1 (P1)**: MVP; enables users to configure ignored transfer sources
- **US2 (P1)**: Core sync behavior; uses ignored transfer config and matching primitives
- **US3 (P2)**: Review/adjust workflow; depends on persisted ignored source list and filtering behavior

### Within Each User Story

- Write or update tests before implementation changes for the same behavior
- Config schema and helpers before setup/config display changes
- Matching helper before sync/backfill filtering
- Sync filtering before backfill verification
- Sanitized display/logging before documentation and manual quickstart checks

## Parallel Opportunities

- T001 and T002 can run in parallel because they touch different fixture files.
- T007 can run in parallel with early setup test authoring after T003 and T004 are drafted.
- T008 and T009 can run in parallel because they use separate setup integration test files.
- T014, T015, T016, and T017 can run in parallel because they target distinct test files.
- T023, T024, and T025 can run in parallel after US1 and US2 implementation paths are available.
- T028 and T029 can run in parallel with final verification because they touch documentation files.

## Parallel Execution Examples

### US1

```text
Task A: T008 Add setup integration test in tests/integration/setup/setup-ignored-transfer-sources.test.ts
Task B: T009 Add setup integration test in tests/integration/setup/setup-ignored-transfer-choices.test.ts
```

### US2

```text
Task A: T014 Add matcher unit tests in tests/unit/sync/ignored-transactions.test.ts
Task B: T015 Add sync runner test in tests/unit/sync/ignored-related-transactions.test.ts
Task C: T017 Add backfill integration test in tests/integration/backfill/backfill-ignored-transfer-sources.test.ts
```

### US3

```text
Task A: T023 Add config show sanitization test in tests/unit/commands/config-show-sanitization.test.ts
Task B: T024 Add setup reconfigure test in tests/integration/setup/setup-reconfigure.test.ts
Task C: T025 Add setup-to-sync behavior test in tests/integration/sync/setup-to-sync.test.ts
```

## Implementation Strategy

### MVP First

Complete Phase 1, Phase 2, and Phase 3 to let users configure ignored transfer sources during setup and see them saved safely. This delivers the first P1 story without changing import behavior yet.

### Incremental Delivery

1. Add sync/backfill filtering in Phase 4 and verify ignored transfers are excluded without affecting unrelated imports.
2. Add review/reconfigure behavior in Phase 5 so users can safely inspect and adjust the ignored source list.
3. Finish docs and full build/test verification in Phase 6.

### Validation Scope

- `npm run build`
- `npm test`
- Manual quickstart check from `specs/005-ignore-transfer-transactions/quickstart.md`

## Notes

- Do not add a local transaction database, cursor, or last-synced transaction state.
- Do not treat every skipped setup source as ignored unless the user explicitly selects it as an ignored transfer source.
- Prefer false negatives over false positives: ambiguous transactions stay eligible for import.
- Do not print or persist full PANs, full IBANs, API tokens, or raw credential values.
- Keep Lunch Money v1 adapter boundaries and existing import payload semantics unchanged for non-excluded transactions.
