# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript + Node.js unless explicitly justified
**Primary Dependencies**: CLI framework, HTTP client, validation, test runner; keep small
**Storage**: User config/log/lock files only; no local transaction database
**Testing**: Unit tests plus mocked API integration tests for touched sync behavior
**Target Platform**: Windows-friendly local CLI and Windows Task Scheduler
**Project Type**: Local CLI application
**Performance Goals**: Respect external API limits; batch Lunch Money inserts at max 500
**Constraints**: Stateless idempotency, non-interactive sync, no tokens in args/logs/config
**Scale/Scope**: Personal Monobank accounts/cards mapped to Lunch Money manual assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Stateless idempotency: no local transaction database, cursor, last sync timestamp,
  or last transaction id as source of truth; deterministic `external_id` defined.
- CLI boundary: setup may be interactive; sync, scheduler status/uninstall, and
  config show remain non-interactive and Windows Task Scheduler-compatible.
- Security: tokens resolved from environment or secure storage; no tokens in
  config, logs, scheduler commands, or CLI arguments; sensitive account data masked.
- API contracts: Monobank window, 60-second statement limit, 500-item paging,
  Lunch Money v1 adapter, max 500 transaction inserts, and v2 isolation addressed.
- Import semantics: `status: "uncleared"`, configured tags, compact notes,
  `skip_duplicates`, and `skip_balance_update` are preserved.
- Operations: lock file behavior, readable logs, partial account failure policy,
  and non-zero failure exit behavior are planned.
- Tests: affected behavior has tests for external ids, money/date mapping, notes
  limit, config validation, paging/chunking, duplicate reruns, and scheduler token
  safety.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
  tasks.md
```

### Source Code (repository root)

```text
src/
  cli.ts
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
  utils/
    date.ts
    money.ts
    masking.ts

tests/
  unit/
  integration/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., local transaction database] | [current need] | [why Lunch Money external_id dedupe is insufficient] |
| [e.g., hosted service] | [current need] | [why local scheduled CLI is insufficient] |
