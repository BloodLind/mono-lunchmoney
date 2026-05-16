# Research: Ignore Transfer Transactions

## Decision: Store ignored transfer sources as static config

Ignored transfer sources will be stored in a dedicated config list separate from imported account mappings.

**Rationale**: The user needs to choose accounts/cards whose related transfers should be suppressed without turning those accounts into Lunch Money import mappings. Static config is allowed by the constitution and keeps sync/backfill stateless.

**Alternatives considered**:

- Store exclusions per transaction: rejected because it creates local imported-transaction state.
- Treat every skipped Monobank account as ignored without an explicit setup choice: rejected because skipping import and using a source for transfer filtering are related but different user intents.
- Put ignore flags directly on Lunch Money mappings only: rejected because ignored sources may not be imported mappings.

## Decision: Match only when the transaction can be confidently related to an ignored source

Filtering will only exclude a transaction when it matches reliable ignored source metadata, such as a hashed counterparty IBAN or a masked card/PAN reference in counterparty text.

**Rationale**: Hiding unrelated spending is worse than leaving an internal transfer visible for review. The specification explicitly prefers false negatives over false positives.

**Alternatives considered**:

- Exclude by broad description keywords such as "transfer": rejected because it could hide legitimate external transfers or payments.
- Exclude by amount/date pairing between accounts: rejected because it needs cross-account transaction state and is fragile around fees, currency conversion, and timing.
- Require only exact counterparty IBAN: rejected as too narrow because card-to-card transfers may only expose masked card information.

## Decision: Apply filtering in the shared sync/backfill path before mapping

Sync and backfill will fetch statements normally, filter excluded transfer transactions, and map/import only the remaining transactions.

**Rationale**: Sync and backfill must behave identically for repeated windows and duplicate-safe imports. Filtering before mapping also preserves existing Lunch Money import semantics for eligible transactions.

**Alternatives considered**:

- Filter after Lunch Money transaction mapping: rejected because it risks generating external ids and notes for transactions that are not supposed to be submitted.
- Add filtering separately to each command: rejected because sync and backfill could drift.
- Filter before fetching statements: rejected because Monobank statement calls are account-window based and do not support source-side transfer filtering.

## Decision: Report skipped ignored-transfer counts without sensitive identifiers

Logs and console progress will report counts per imported account, using existing safe account display names and no full source account identifiers.

**Rationale**: Users need visibility that filtering occurred, but the project constitution forbids full account identifiers in logs and console output.

**Alternatives considered**:

- Log matched ignored source ids for debugging: rejected because full identifiers are sensitive.
- Stay silent when filtering removes transactions: rejected because sync could appear to import fewer transactions without explanation.

## Decision: All-excluded windows are successful only when reported clearly

If an account fetches transactions and all are excluded by ignored transfer rules, the command may complete successfully, but it must report that zero transactions were eligible. If no syncable mapped accounts remain because of ignore settings, the command must fail clearly.

**Rationale**: Filtering is an intentional user choice, not an error by itself. A configuration that leaves nothing syncable is a setup/config problem and should not look like a normal import run.

**Alternatives considered**:

- Fail whenever all fetched transactions are excluded: rejected because a normal day may contain only internal transfers.
- Always return success even with no syncable accounts: rejected because it hides a broken or contradictory configuration.
