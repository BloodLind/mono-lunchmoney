# Implementation Plan: Ignore Transfer Transactions

**Branch**: `005-ignore-transfer-transactions` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-ignore-transfer-transactions/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add setup-configurable ignored transfer sources so transfers involving selected Monobank accounts/cards can be excluded from Lunch Money imports on other mapped accounts. The implementation will keep the ignored source list as static config, display it safely in setup/config output, and apply confidence-based filtering in the shared sync/backfill path before transaction mapping and Lunch Money import.

## Technical Context

**Language/Version**: TypeScript + Node.js `>=20.19.0`
**Primary Dependencies**: Existing Commander CLI, Zod validation, Vitest tests, built-in Node APIs; no new runtime package planned
**Storage**: Static config/log/lock files only; ignored transfer sources are stored as config, with no local transaction database or cursor
**Testing**: Unit tests for config parsing, matching, and sync filtering plus mocked integration tests for setup, config display, sync, and backfill behavior
**Target Platform**: Windows-friendly local CLI and Windows Task Scheduler
**Project Type**: Local CLI application
**Performance Goals**: Filtering must happen in memory after statement fetch and before import without adding extra provider calls; existing Monobank limits and 500-item Lunch Money batches remain unchanged
**Constraints**: Stateless idempotency, non-interactive sync/backfill, no tokens in args/logs/config, false negatives preferred over false positives for ambiguous transfer matching
**Scale/Scope**: Personal Monobank accounts/cards discovered during setup, a user-selected ignored source list, and imported mappings to Lunch Money manual assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Stateless idempotency: PASS. Ignored transfers are derived from the fetched statement plus static ignored source config; no local transaction database, cursor, last sync timestamp, or last transaction id is introduced. Imported transactions keep existing deterministic `external_id` behavior.
- CLI boundary: PASS. Setup may prompt for ignored transfer sources. `sync`, `backfill`, `scheduler status/uninstall`, and `config show` remain non-interactive and scheduler-compatible.
- Security: PASS. Ignored source display uses masked/safe identifiers only. Tokens remain in secure sources and are not added to config, logs, scheduler commands, or CLI arguments.
- API contracts: PASS. Monobank fetching windows, 60-second statement limit, 500-item paging, Lunch Money v1 adapter boundaries, and 500-item insert batching are unchanged.
- Import semantics: PASS. Non-excluded transactions preserve `status: "uncleared"`, configured tags, compact notes, duplicate-safe options, and `skip_balance_update`.
- Operations: PASS. Existing lock, logs, account-level failure policy, and non-zero failure handling remain. New logs report skipped ignored-transfer counts without sensitive identifiers.
- Tests: PASS. Planned tests cover ignored source config, setup/config display sanitization, confidence-based matching, sync/backfill exclusion, unrelated transaction import, reruns, and all-excluded reporting.

## Project Structure

### Documentation (this feature)

```text
specs/005-ignore-transfer-transactions/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    cli.md
    config.md
  tasks.md
```

### Source Code (repository root)

```text
src/
  cli.ts
  cli/
    ui.ts
  commands/
    setup.command.ts
    sync.command.ts
    backfill.command.ts
    scheduler.command.ts
    config.command.ts
  config/
    config.model.ts
    config.loader.ts
    config.writer.ts
    paths.ts
    tokens.ts
  credentials/
    credential-store.ts
    protected-credential-store.ts
  monobank/
    mono-client.ts
    mono-types.ts
    mono-rate-limiter.ts
    statement-fetcher.ts
    currency-map.ts
  lunchmoney/
    budget-provider.ts
    lunchmoney-v1-client.ts
    lunchmoney-types.ts
  mapping/
    mono-to-lunchmoney.mapper.ts
    external-id.ts
    notes-builder.ts
  scheduler/
    windows-task-scheduler.ts
  locking/
    lock-file.ts
  logging/
    logger.ts
  notifications/
  sync/
    backfill-windows.ts
    ignored-transactions.ts
    sync-runner.ts
  utils/
    date.ts
    hash.ts
    money.ts
    masking.ts

tests/
  unit/
    config/
    sync/
  integration/
    setup/
    sync/
    backfill/
    config/
```

**Structure Decision**: Keep the feature within existing CLI/config/sync modules. `src/config/config.model.ts` owns the ignored source schema, setup writes the list, config display sanitizes it, and `src/sync/ignored-transactions.ts` contains reusable matching that `src/sync/sync-runner.ts` applies for both sync and backfill windows.

## Post-Design Constitution Check

- Stateless idempotency: PASS. Research and design store only user-selected ignored sources and matcher metadata; excluded transaction results are not persisted.
- CLI boundary: PASS. Contracts keep interactivity in setup and keep sync/backfill/config show non-interactive.
- Security: PASS. Data model forbids tokens and full financial identifiers in display/log output; config stores only masked PAN and hashed IBAN matcher data where available.
- API contracts: PASS. Filtering occurs after Monobank statement retrieval and before Lunch Money import, so provider limits and adapter boundaries remain unchanged.
- Import semantics: PASS. Only eligible transactions are mapped/imported; all existing mapping semantics remain unchanged for those transactions.
- Operations: PASS. Quickstart and contracts cover skipped counts, all-excluded/no-eligible cases, and repeated runs.
- Tests: PASS. Planned verification covers setup selection, sanitized config output, exact/hash and masked-PAN matching, ambiguous non-matches, sync/backfill filtering, and unrelated transaction imports.

## Complexity Tracking

No constitution violations are planned.
