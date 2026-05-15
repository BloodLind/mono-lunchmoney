# Feature Specification: Monobank to Lunch Money Sync

**Feature Branch**: `002-mono-lunch-sync`
**Created**: 2026-05-15
**Status**: Draft
**Input**: User description: "Based on AGENTS.md provide independent specifications"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Tracked Accounts (Priority: P1)

As a personal budget user, I want a guided setup that shows my available
Monobank accounts and cards, lets me choose which ones to track, and maps each
selected source to the correct Lunch Money manual account so future imports go
to the right place.

**Why this priority**: No sync can be trusted until the user has explicitly
chosen the financial sources and destination accounts.

**Independent Test**: With valid credentials and mocked provider data, run setup,
select one source, map it to an existing destination account or create a new one,
and verify that a sanitized configuration summary is saved.

**Acceptance Scenarios**:

1. **Given** valid credentials and multiple Monobank sources, **When** the user
   runs setup, **Then** the user sees masked source details and can track or skip
   each source.
2. **Given** a selected Monobank source, **When** the user chooses an existing
   Lunch Money account, **Then** the saved mapping links that source to the
   selected account and stores no API tokens.
3. **Given** a selected Monobank source, **When** the user creates a new Lunch
   Money account during setup, **Then** the created account is mapped and shown
   in the sanitized summary.

---

### User Story 2 - Run Safe Manual Sync (Priority: P1)

As a budget user, I want to run sync manually at any time so recent Monobank
transactions are imported into the mapped Lunch Money accounts as review-pending
items without creating duplicates.

**Why this priority**: Manual sync is the core value of the bridge and must be
safe before scheduled automation is useful.

**Independent Test**: With a saved config and mocked recent transactions, run
sync twice for the same source and verify that the second run creates no
duplicates while preserving review status, tags, notes, and destination account.

**Acceptance Scenarios**:

1. **Given** a valid config with one enabled mapping, **When** sync runs, **Then**
   eligible transactions are imported to the mapped Lunch Money account.
2. **Given** the same config and same transaction set, **When** sync runs again,
   **Then** no duplicate transactions are created.
3. **Given** imported transactions, **When** the user reviews them in Lunch
   Money, **Then** each one is review-pending, tagged with the configured sync
   tag, and includes compact Monobank metadata.

---

### User Story 3 - Run Daily Background Sync (Priority: P2)

As a budget user on Windows, I want the tool to register a daily background
sync so my budget stays current without me keeping a server or app open.

**Why this priority**: Daily automation is required for the intended background
workflow, but it depends on setup and sync already being correct.

**Independent Test**: Install a daily schedule for a chosen time, inspect the
registered task, verify it runs the quiet sync command without credentials in
the command, then uninstall it.

**Acceptance Scenarios**:

1. **Given** a completed setup, **When** the user installs a daily schedule,
   **Then** a Windows scheduled task is registered for the requested time.
2. **Given** an installed schedule, **When** the user checks scheduler status,
   **Then** task existence, next run, last run, result code, and command are
   reported without exposing secrets.
3. **Given** an installed schedule, **When** the user uninstalls it, **Then** the
   scheduled task is removed and subsequent status shows it no longer exists.

---

### User Story 4 - Backfill Historical Transactions (Priority: P3)

As a budget user, I want to import a specified historical date range so I can
populate Lunch Money with older Monobank transactions while retaining the same
duplicate protection as normal sync.

**Why this priority**: Backfill is valuable after initial setup, but daily recent
sync must work first.

**Independent Test**: With a valid config and a requested historical range, run
backfill twice and verify the range is fully processed once, split into provider
safe windows, and duplicate-free on rerun.

**Acceptance Scenarios**:

1. **Given** a historical date range, **When** backfill runs, **Then** the range
   is processed in valid windows for each enabled mapping.
2. **Given** the same historical range, **When** backfill runs again, **Then** no
   duplicate transactions are created.
3. **Given** imported historical transactions, **When** they appear in Lunch
   Money, **Then** they use the same review status, tags, notes, and destination
   mapping as normal sync.

---

### User Story 5 - Inspect Safe Configuration and Logs (Priority: P3)

As a budget user troubleshooting the bridge, I want to inspect saved
configuration and readable logs without revealing API tokens or full financial
identifiers.

**Why this priority**: Troubleshooting must be possible without weakening the
security posture of the tool.

**Independent Test**: Show configuration and sample sync logs that include
mapped accounts, scheduler settings, and sync results while confirming tokens,
full card numbers, and full IBANs are absent.

**Acceptance Scenarios**:

1. **Given** a saved config, **When** the user runs config display, **Then** the
   output includes mappings and defaults but excludes secrets.
2. **Given** a sync success, **When** the user opens the sync log, **Then** the
   log summarizes fetched and submitted transaction counts per mapped account.
3. **Given** a sync failure, **When** the user opens the error log, **Then** the
   log contains a readable failure reason and no secrets.

---

### Edge Cases

- Sync is run twice for the same date range and transaction set.
- Sync starts while another sync is already running.
- A previous sync crashed and left a lock behind.
- One mapped account fails while other mapped accounts can still sync safely.
- Required credentials are missing, invalid, or expired.
- A provider returns the maximum number of transactions for a statement window.
- The configured lookback or backfill range exceeds a provider's allowed window.
- A transaction has a long identifier, long payee, or enough metadata to exceed
  target field limits.
- A source includes sensitive card or account identifiers that must be displayed
  only in masked form.
- The scheduled task exists but was last run with an error result.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST resolve required Monobank and Lunch Money
  credentials from user-level environment variables or secure user-level storage.
- **FR-002**: The setup flow MUST validate access to both providers before
  asking the user to create or save mappings.
- **FR-003**: The setup flow MUST display available Monobank sources with enough
  masked details for the user to distinguish them.
- **FR-004**: The setup flow MUST let the user track or skip each available
  Monobank source.
- **FR-005**: The setup flow MUST let the user map each tracked source to an
  existing Lunch Money manual account or create a new manual account.
- **FR-006**: The system MUST save configuration containing mappings, selected
  sources, tags, lookback defaults, scheduler settings, and file paths.
- **FR-007**: Saved configuration MUST NOT contain plain API tokens.
- **FR-008**: Sync MUST run without user prompts using the saved configuration.
- **FR-009**: Sync MUST import transactions for every enabled mapping within the
  configured recent lookback window.
- **FR-010**: Every imported transaction MUST be assigned to the configured
  Lunch Money account for its Monobank source.
- **FR-011**: Every imported transaction MUST be review-pending, tagged with the
  configured sync tag, and include compact Monobank metadata.
- **FR-012**: Every imported transaction MUST use a stable duplicate-prevention
  identifier so reruns and crash recovery do not create duplicates.
- **FR-013**: Sync and backfill MUST respect provider-imposed statement windows,
  pacing limits, result paging, and destination batch limits.
- **FR-014**: Sync MUST prevent overlapping runs through a lock and recover from
  stale locks after a bounded stale period.
- **FR-015**: If one mapped account fails, sync MUST continue with remaining
  accounts when safe and return a failure result after all possible work ends.
- **FR-016**: Sync MUST write readable success and error logs that never include
  API tokens or full financial identifiers.
- **FR-017**: Scheduler install MUST create a daily Windows scheduled task for
  the requested time and invoke quiet sync using the saved config.
- **FR-018**: Scheduled task commands MUST NOT contain API tokens.
- **FR-019**: Scheduler status MUST report whether the task exists, its name,
  next run, last run, last result, and configured command.
- **FR-020**: Scheduler uninstall MUST remove the scheduled task without
  requiring user prompts.
- **FR-021**: Config display MUST print a sanitized configuration summary without
  secrets or full sensitive identifiers.
- **FR-022**: Backfill MUST import a requested historical range by splitting it
  into provider-safe windows and using the same duplicate protection as sync.

### Constitution-Aligned Requirements

- **CAR-001**: The feature MUST NOT introduce a local transaction database or
  imported transaction cursor as source of truth.
- **CAR-002**: Any imported transaction MUST preserve deterministic idempotency
  through a stable identifier accepted by Lunch Money.
- **CAR-003**: Non-setup commands in scope MUST run without prompts.
- **CAR-004**: Tokens MUST NOT be stored in plain config, passed as arguments,
  printed, or logged.
- **CAR-005**: Sensitive account identifiers MUST be masked in console output,
  config display, and logs.
- **CAR-006**: Monobank statement windows, rate limits, and maximum-result paging
  MUST be represented when statement fetching is in scope.
- **CAR-007**: Lunch Money imports MUST use manual accounts, provider-safe batch
  sizes, review-pending status, configured tags, compact notes, and
  duplicate-safe insert behavior when transaction import is in scope.
- **CAR-008**: Scheduler behavior in scope MUST use Windows Task Scheduler and
  MUST NOT include API tokens in the registered command.

### Key Entities *(include if feature involves data)*

- **Monobank Source**: A selectable personal, card, or supported business
  account source with display name, account type, currency, masked identifiers,
  and current balance information.
- **Lunch Money Manual Account**: A destination budget account selected or
  created by the user for one tracked Monobank source.
- **Account Mapping**: The saved relationship between a Monobank source and a
  Lunch Money manual account, including enabled state, display names, currency,
  tag, and duplicate-prevention prefix.
- **Sync Configuration**: User-level settings for mappings, defaults, scheduler
  preferences, and file locations, excluding API tokens.
- **Imported Transaction**: A Monobank transaction transformed into a Lunch Money
  transaction with date, amount, currency, payee, destination account,
  review-pending status, tag, stable duplicate-prevention identifier, and compact
  notes.
- **Scheduled Sync Task**: A Windows background registration containing task
  name, daily time, command, and run status.
- **Sync Run Log**: A readable record of sync start, per-account results,
  inserted or ignored transaction counts when available, and sanitized failures.

### Scope Boundaries

- Hosted servers, webhooks, real-time sync, GUI, automatic categorization,
  transaction deletion, transaction reconciliation, multi-user workflows, and
  investment or crypto tracking are outside the first version.
- Jars are outside the default setup flow unless explicitly enabled later.
- Lunch Money is the storage target for imported transaction identity; local
  config may store mappings and settings but not imported transaction progress.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can complete setup for one Monobank source and
  save a valid sanitized configuration in under 10 minutes.
- **SC-002**: Running sync twice against the same unchanged transaction set
  creates zero duplicate Lunch Money transactions.
- **SC-003**: 100% of imported transactions are assigned to the mapped Lunch
  Money account, marked review-pending, tagged, and include compact metadata.
- **SC-004**: Scheduled sync can be installed, inspected, and uninstalled, and
  the registered command contains zero API tokens.
- **SC-005**: Backfill for a historical range can be rerun with zero duplicates
  while covering the full requested range.
- **SC-006**: 100% of config display output and logs omit API tokens, full card
  numbers, and full IBANs in validation samples.
- **SC-007**: When one mapped account fails and another can safely continue, the
  successful account still completes and the overall run reports failure.

## Assumptions

- The primary user is a single Windows user importing personal budget data.
- Monobank and Lunch Money credentials are supplied outside the saved config.
- Lunch Money manual accounts are the intended destinations for imported
  transactions.
- Recent sync uses a 31-day lookback unless the saved config overrides it.
- The default import tag is `monobank-sync` unless the user configures another
  tag globally or per account.
- Imported transactions remain review-pending so the user can manually review
  and categorize them in Lunch Money.
