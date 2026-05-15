# Research: Monobank to Lunch Money Sync

## Runtime And Dependency Set

**Decision**: Use the existing TypeScript/Node.js stack: Node.js `>=20.19.0`,
Commander for CLI wiring, Zod for config and option validation, Vitest for
tests, and built-in Node APIs for HTTP, hashing, prompts, files, and PowerShell
execution.

**Rationale**: The repository already ships this stack in `package.json`, and it
is sufficient for a small local CLI. Native `fetch`, `crypto`, `fs`, and
`readline/promises` avoid adding dependencies that would not materially simplify
the implementation.

**Alternatives considered**: Axios or undici client wrappers, Inquirer prompts,
and YAML/config helper packages. These add maintenance surface without changing
the simple request/response and prompt flow needed here.

## Token Resolution

**Decision**: Resolve `MONO_TOKEN` and `LUNCHMONEY_TOKEN` from the process
environment for this slice, with an adapter boundary that can later add Windows
Credential Manager support.

**Rationale**: Environment variables satisfy the current security requirement:
tokens are not stored in `config.json`, not passed in scheduled task arguments,
and not logged. A small `config/tokens.ts` module keeps future secure storage
isolated.

**Alternatives considered**: Prompting for tokens during `setup` and writing
them to config was rejected because it violates the no-plain-config-secret rule.
Passing tokens as command-line options was rejected because scheduled task
arguments are inspectable.

## Monobank API Usage

**Decision**: Implement a `MonoClient` for `GET /personal/client-info` and
`GET /personal/statement/{account}/{from}/{to}`, plus a `StatementFetcher` that
keeps statement windows at or below 31 days plus 1 hour, waits at least 60
seconds between statement requests, and pages backward when exactly 500 items
are returned.

**Rationale**: Monobank's official personal API documentation describes the
statement endpoint's maximum 31-day plus 1-hour period, one request per 60
seconds pacing, and maximum 500 returned transactions from the `to` timestamp
backward. Keeping this logic outside commands makes `sync` and `backfill` reuse
the same API-safe path.

**Alternatives considered**: Parallel account fetching was rejected because it
risks rate-limit violations. Storing cursors was rejected because the
constitution requires Lunch Money idempotency rather than local transaction
state.

**Sources**:

- Monobank personal statement API: https://monobank.ua/api-docs/monobank/kliientski-personalni-dani/get--personal--statement--%7Baccount%7D--%7Bfrom%7D--%7Bto%7D
- Monobank client info API: https://monobank.ua/api-docs/monobank/kliientski-personalni-dani/get--personal--client-info

## Lunch Money API Usage

**Decision**: Implement `BudgetProvider` with a Lunch Money v1 adapter covering
manual account listing, manual account creation, and transaction import.
Transaction import uses batches of at most 500 items with `asset_id`,
`status: "uncleared"`, `external_id`, `tags`, compact `notes`, and request
options `apply_rules: false`, `skip_duplicates: true`,
`check_for_recurring: false`, `debit_as_negative: true`, and
`skip_balance_update: true`.

**Rationale**: Lunch Money's official v1 docs expose `/v1/assets` for manual
assets and `/v1/transactions` for insertions. The transaction create docs define
the 500-item limit, `external_id` idempotency, status values, tag handling, and
manual account fields needed for this flow.

**Alternatives considered**: Lunch Money v2 was rejected for the first version
because the product spec explicitly targets v1 and v2 changes account and tag
field names. Direct Lunch Money calls from command modules were rejected because
the constitution requires an adapter boundary for future v2 isolation.

**Sources**:

- Lunch Money API reference: https://lunchmoney.dev/

## Deterministic Idempotency

**Decision**: Build `external_id` as `mono:<monoAccountId>:<monoTransactionId>`
when the value is at most 75 characters. When it would exceed 75 characters,
build `mono:<accountHash>:<transactionHash>` using SHA-256 hex truncated to fixed
short lengths.

**Rationale**: The same Monobank account and transaction must produce the same
Lunch Money identity across normal sync, backfill, reruns, and crash recovery.
The deterministic hash fallback satisfies the Lunch Money length limit while
preserving the invariant.

**Alternatives considered**: Random ids and local sequence numbers were rejected
because reruns would duplicate transactions. Persisted last-sync cursors were
rejected because they are imported transaction state.

## Transaction Mapping

**Decision**: Map Monobank minor-unit amounts into decimal strings by currency
minor units, use a local `YYYY-MM-DD` date from the transaction timestamp, choose
payee from description/counterparty/comment fallback order, and build compact
semicolon-separated notes with required `mono_id` and `mono_acc` fields plus
optional metadata only while under 350 characters.

**Rationale**: This preserves human-reviewable Lunch Money transactions while
keeping visible notes concise and within the documented note limit. Minor-unit
conversion is deterministic and easy to test.

**Alternatives considered**: Storing full Monobank JSON in notes was rejected
because it exceeds the target field size and exposes too much financial data.
UTC-only dates were deferred because the spec prefers local UI consistency.

## Setup Interaction

**Decision**: Implement setup with `readline/promises`, sequential prompts, and
explicit confirmation for each source. Existing Lunch Money assets are listed
for mapping, and account creation uses proposed defaults that the user may
accept or edit.

**Rationale**: Setup is the only interactive command, so a lightweight built-in
prompt loop keeps dependencies small and matches the command-line UX in the
specification.

**Alternatives considered**: A GUI and hosted OAuth-style flow were rejected as
out of scope. A prompt library can be revisited only if the built-in flow becomes
hard to maintain.

## Locking And Logs

**Decision**: Acquire `sync.lock` atomically with exclusive file creation,
record PID and timestamp, treat locks older than six hours as stale, and always
sanitize log lines before appending to `sync.log` or `error.log`.

**Rationale**: Lunch Money external-id dedupe handles correctness, while the
lock reduces overlapping API calls and noisy failures. PID/timestamp metadata
allows safe stale-lock recovery without becoming transaction state.

**Alternatives considered**: No lock was rejected because scheduled and manual
syncs could overlap. A database-backed lock was rejected because the project
must avoid a local database.

## Backfill Windows

**Decision**: Split requested date ranges into inclusive windows no larger than
31 days for each enabled account and feed each window through the same fetch,
map, chunk, import, and logging pipeline as normal sync.

**Rationale**: This satisfies Monobank's statement window limit and keeps
backfill duplicate behavior identical to sync.

**Alternatives considered**: Making backfill store progress was rejected because
reruns should be safe through deterministic `external_id`, not local state.
