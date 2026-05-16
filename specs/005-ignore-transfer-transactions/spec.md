# Feature Specification: Ignore Transfer Transactions

**Feature Branch**: `005-ignore-transfer-transactions`
**Created**: 2026-05-16
**Status**: Draft
**Input**: User description: "Add ability to ignore transactions related to money transfer from account A to account B. This should be configurable during setup and provided by user what accounts transactions should be ignored"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Ignored Transfer Sources During Setup (Priority: P1)

A user running setup can choose which Monobank accounts/cards should be treated as ignored transfer sources, separate from the accounts/cards that are imported into Lunch Money.

**Why this priority**: The user must be able to describe the financial relationship before sync can safely suppress internal-transfer transactions.

**Independent Test**: Complete setup with at least two Monobank sources, mark one source as an ignored transfer source, map another source for import, then verify the saved configuration summary clearly shows the ignored source without exposing sensitive account details.

**Acceptance Scenarios**:

1. **Given** setup discovers multiple Monobank sources, **When** the user marks one source as ignored for transfer filtering, **Then** setup saves that source in a dedicated ignored-transfer list.
2. **Given** a source is marked as ignored, **When** setup prints the final summary or config display, **Then** the ignored source is shown with masked identifiers and is separate from imported account mappings.

---

### User Story 2 - Exclude Transfers Involving Ignored Sources (Priority: P1)

A user who transfers money from an ignored account to an imported account does not want that transfer transaction to appear in Lunch Money from the imported account side.

**Why this priority**: This is the core budgeting outcome. Internal movement from accounts the user chose to ignore should not look like income, spending, or duplicate activity.

**Independent Test**: Configure account A as an ignored transfer source and account B as imported, then sync a statement for account B containing a transfer from account A and an unrelated purchase. Verify the transfer is excluded and the unrelated purchase remains eligible for import.

**Acceptance Scenarios**:

1. **Given** account A is an ignored transfer source and account B is imported, **When** account B contains a transaction identified as a transfer from account A, **Then** that transaction is not imported into Lunch Money.
2. **Given** account B contains unrelated transactions, **When** sync runs with account A ignored, **Then** unrelated transactions are still imported normally.
3. **Given** the same date range is synced repeatedly, **When** ignored transfer transactions are encountered again, **Then** they remain excluded without creating local transaction state.

---

### User Story 3 - Review And Adjust Ignore Rules (Priority: P2)

A user can inspect which Monobank sources are currently used for transfer ignoring and can rerun setup to adjust the list when their account usage changes.

**Why this priority**: Users need confidence that ignored transfer behavior is intentional and recoverable, especially when cards/accounts are added, replaced, or no longer used.

**Independent Test**: Show the saved configuration, verify ignored transfer sources are listed safely, rerun setup to change ignored selections, and verify the next sync follows the updated selections.

**Acceptance Scenarios**:

1. **Given** ignored transfer sources are saved, **When** the user runs config display, **Then** the ignored list is visible with masked identifiers and no token or full account values.
2. **Given** the user changes ignored transfer selections during setup reconfiguration, **When** sync runs later, **Then** the updated ignored list controls which transfer transactions are excluded.

---

### Edge Cases

- A transfer transaction cannot be confidently associated with a selected ignored source.
- The same Monobank source is both mapped for import and selected as an ignored transfer source.
- An ignored source is removed, replaced, or renamed by Monobank after setup.
- A transfer uses a counterparty label or card suffix rather than a full account identifier.
- Multiple ignored sources can match the same transaction.
- All mapped import sources are also selected as ignored sources.
- Repeated sync/backfill runs encounter the same ignored transfer transactions.
- A sync run crashes after fetching transactions but before import.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Setup MUST allow users to select Monobank accounts/cards that should be used as ignored transfer sources.
- **FR-002**: The ignored transfer source list MUST be saved separately from imported account mappings.
- **FR-003**: Config display and setup summaries MUST show ignored transfer sources using masked/safe identifiers only.
- **FR-004**: Sync and backfill MUST exclude transactions on imported accounts when those transactions are identified as transfers involving an enabled ignored transfer source.
- **FR-005**: Sync and backfill MUST continue importing unrelated transactions from the same imported account.
- **FR-006**: If a transaction cannot be confidently identified as related to an ignored transfer source, the system MUST NOT exclude it solely by guesswork.
- **FR-007**: Users MUST be able to change the ignored transfer source list by rerunning setup/reconfiguration.
- **FR-008**: Excluding transfer transactions MUST NOT rely on local imported-transaction state, last-sync cursors, or transaction history databases.
- **FR-009**: Repeated sync or backfill runs MUST apply the same ignored transfer rules consistently.
- **FR-010**: Logs and console progress MUST report how many transactions were excluded because of ignored transfer rules without exposing sensitive account identifiers.
- **FR-011**: If all configured imports are excluded by ignore settings, sync/backfill MUST fail clearly or report no eligible imports rather than silently appearing successful.
- **FR-012**: Existing imported transaction semantics for non-excluded transactions MUST remain unchanged.

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

- **Ignored Transfer Source**: A Monobank account/card selected by the user as a source whose related transfer transactions should be excluded from imports.
- **Imported Account Mapping**: A Monobank account/card mapped to a Lunch Money account for normal transaction imports.
- **Excluded Transfer Transaction**: A transaction found on an imported account that is identified as a transfer involving an ignored transfer source and therefore is not imported.
- **Ignore Configuration Summary**: A safe display of ignored transfer sources and import mappings without full account identifiers or secret values.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: During setup, users can mark ignored transfer sources and complete setup without editing configuration files manually.
- **SC-002**: In a test statement containing one ignored-source transfer and one unrelated transaction, 100% of identified ignored-source transfers are excluded while unrelated transactions remain eligible for import.
- **SC-003**: Re-running sync or backfill for the same period excludes the same ignored-source transfer transactions every time without storing local transaction progress.
- **SC-004**: Config display, setup summary, logs, and console output reveal zero full card numbers, full account identifiers, full IBANs, or API token values for ignored sources.
- **SC-005**: Users can verify the ignored transfer source list from CLI output in under 30 seconds.

## Assumptions

- The tool remains a local Windows-friendly CLI without a hosted service.
- API tokens are available through environment variables or secure user storage.
- Lunch Money API v1 is the target unless a later spec explicitly changes it.
- Static/semi-static config may be stored; imported transaction state may not.
- Ignored transfer matching should favor false negatives over false positives: uncertain transactions should remain eligible for import rather than being hidden unexpectedly.
- User-selected ignored transfer sources are intended to suppress internal-transfer noise, not to hide unrelated spending from imported accounts.
