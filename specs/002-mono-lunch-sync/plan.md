# Implementation Plan: Monobank to Lunch Money Sync

**Branch**: `002-mono-lunch-sync` | **Date**: 2026-05-16 | **Spec**: `specs/002-mono-lunch-sync/spec.md`
**Input**: Feature specification from `specs/002-mono-lunch-sync/spec.md`

**Note**: This plan is produced by the `/speckit-plan` workflow and stops at
Phase 2 planning. Implementation tasks are generated separately.

## Summary

Implement the full stateless Monobank to Lunch Money bridge on top of the
existing TypeScript CLI skeleton. The feature adds provider clients, account
setup, transaction mapping, deterministic Lunch Money `external_id` generation,
sync/backfill orchestration, lock-file protection, sanitized logging, and tests
for duplicate-safe repeated imports. The local config remains limited to
selected account mappings, defaults, scheduler settings, and file paths; Lunch
Money remains the idempotent transaction store.

## Technical Context

**Language/Version**: TypeScript 5.9 on Node.js `>=20.19.0`
**Primary Dependencies**: Existing Commander 14 CLI, Zod 4 validation, Vitest 4
tests, Node built-in `fetch`, `fs`, `crypto`, `readline/promises`, and
`child_process`; no new runtime dependency is required for the planned slice.
**Storage**: User config/log/lock files only under resolved runtime paths; no
local transaction database, cursor, last transaction id, or last synced timestamp.
**Testing**: Unit tests plus mocked API integration tests for setup, sync,
backfill, paging, chunking, duplicate reruns, config validation, and scheduler
command safety.
**Target Platform**: Windows-friendly local CLI and Windows Task Scheduler, with
non-scheduler commands remaining usable in development on non-Windows platforms
where possible.
**Project Type**: Local CLI application.
**Performance Goals**: Respect Monobank statement pacing of one request per 60
seconds, keep statement windows within 31 days plus 1 hour, and batch Lunch
Money inserts at no more than 500 transactions per request.
**Constraints**: Stateless idempotency, non-interactive sync/backfill/scheduler
status/config show, no tokens in args/logs/config, sanitized account identifiers,
and no hosted server or permanent daemon.
**Scale/Scope**: Single-user personal Monobank accounts/cards and supported FOP
sources mapped one-to-one to Lunch Money manual assets.

## Constitution Check

*GATE: PASS before Phase 0 research. Re-check after Phase 1 design.*

- Stateless idempotency: PASS. The design persists mappings only and derives
  each import identity from `mono:<monoAccountId>:<monoTransactionId>`, using
  deterministic SHA-256 truncation only when Lunch Money's 75-character limit
  requires it.
- CLI boundary: PASS. `setup` is the only interactive command. `sync`,
  `backfill`, `scheduler status`, `scheduler uninstall`, and `config show` remain
  prompt-free and suitable for scheduled/background execution.
- Security: PASS. Tokens are resolved from `MONO_TOKEN` and
  `LUNCHMONEY_TOKEN` or later secure user storage; they are never saved in
  config, scheduler arguments, console summaries, or logs.
- API contracts: PASS. Monobank access is isolated in a client plus statement
  fetcher that enforces the window, pacing, and 500-item backward paging rules.
  Lunch Money access is isolated behind `BudgetProvider` targeting v1.
- Import semantics: PASS. Mapping always sets `status: "uncleared"`, configured
  tag, compact notes, `asset_id`, deterministic `external_id`, and insert
  options `apply_rules: false`, `skip_duplicates: true`,
  `debit_as_negative: true`, and `skip_balance_update: true`.
- Operations: PASS. Sync/backfill acquire `sync.lock`, recover stale locks after
  six hours, write sanitized success/error logs, continue safe account-level
  work after one account fails, and exit non-zero if any account fails.
- Tests: PASS. The implementation task list must include tests for external id
  stability and length, money/date conversion, notes length, mapping fields,
  config validation, Monobank paging, Lunch Money chunking, duplicate reruns,
  lock behavior, partial failures, and scheduler token safety.

## Project Structure

### Documentation (this feature)

```text
specs/002-mono-lunch-sync/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    cli.md
    provider-adapters.md
```

### Source Code (repository root)

Existing slice:

```text
src/
  cli.ts
  cli/
  commands/
    backfill.command.ts
    config.command.ts
    help.command.ts
    scheduler.command.ts
    setup.command.ts
    sync.command.ts
  config/
    config.loader.ts
    config.model.ts
    paths.ts
    runtime-files.ts
  logging/
    logger.ts
  scheduler/
    windows-task-scheduler.ts
  utils/
    masking.ts
```

Planned additions:

```text
src/
  config/
    config.writer.ts
    tokens.ts
  monobank/
    currency-map.ts
    mono-client.ts
    mono-rate-limiter.ts
    mono-types.ts
    statement-fetcher.ts
  lunchmoney/
    budget-provider.ts
    lunchmoney-types.ts
    lunchmoney-v1-client.ts
  mapping/
    external-id.ts
    mono-to-lunchmoney.mapper.ts
    notes-builder.ts
  locking/
    lock-file.ts
  sync/
    backfill-windows.ts
    sync-runner.ts
  utils/
    date.ts
    money.ts

tests/
  unit/
  integration/
```

**Structure Decision**: Keep the current CLI command modules as the public
entrypoints and move provider-specific behavior into `monobank/` and
`lunchmoney/`. Shared import semantics live in `mapping/`, locking in
`locking/`, and orchestration in `sync/` so `sync` and `backfill` reuse the same
idempotency, rate-limit, chunking, and logging paths.

## Complexity Tracking

No constitution violations are planned.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Phase 0: Research

Research output is captured in `specs/002-mono-lunch-sync/research.md`.
All technical unknowns are resolved with local dependency choices and primary API
documentation references.

## Phase 1: Design And Contracts

Design output is captured in:

- `specs/002-mono-lunch-sync/data-model.md`
- `specs/002-mono-lunch-sync/contracts/cli.md`
- `specs/002-mono-lunch-sync/contracts/provider-adapters.md`
- `specs/002-mono-lunch-sync/quickstart.md`

Agent context is updated in `AGENTS.md` to reference this plan.

## Post-Design Constitution Check

*GATE: PASS after Phase 1 design.*

- The data model contains only configuration, runtime coordination, provider
  source/account data, and transient import objects; it does not add imported
  transaction progress state.
- CLI contracts mark `sync`, `backfill`, scheduler status/uninstall, and config
  display as non-interactive and define token-free scheduled commands.
- Provider adapter contracts preserve the Lunch Money v1 boundary and keep
  Monobank rate/window/paging rules out of command modules.
- Quickstart and contracts require environment-based tokens and sanitized output.
- Test guidance covers the constitution-required behavior for mapping,
  idempotency, API limits, locking, logging, and scheduler safety.
