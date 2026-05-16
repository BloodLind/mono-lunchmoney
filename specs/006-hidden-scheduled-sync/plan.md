# Implementation Plan: Hidden Scheduled Sync

**Branch**: `006-hidden-scheduled-sync` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-hidden-scheduled-sync/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Install Windows scheduled sync so it runs fully in the background with no visible terminal, command prompt, empty console, or prompt. The implementation will keep the real sync behavior equivalent to `mono-lunchmoney sync --config <path> --quiet`, but register a short Windows Task Scheduler action that launches that command through a consoleless background wrapper, preserves the sync exit code, and lets `scheduler status` show the intended sync command rather than confusing wrapper details.

## Technical Context

**Language/Version**: TypeScript + Node.js `>=20.19.0`
**Primary Dependencies**: Existing Commander CLI, Zod validation, Vitest tests, built-in Node APIs, Windows Task Scheduler, Windows Script Host for consoleless launch; no new runtime package planned
**Storage**: Existing user config/log/lock files plus a static user-profile scheduler launcher file; no local transaction database
**Testing**: Unit and mocked integration tests for scheduler command generation, launcher content, status parsing, token safety, config persistence, and reinstall behavior
**Target Platform**: Windows-friendly local CLI and Windows Task Scheduler
**Project Type**: Local CLI application
**Performance Goals**: Scheduled startup should add negligible overhead and must preserve existing sync runtime, Monobank limits, and Lunch Money insert batching
**Constraints**: No visible scheduled-run UI except configured notifications, no prompts, no API tokens in registered task action or status output, preserve sync exit code for task history
**Scale/Scope**: One Windows user-level scheduled task per configured task name, using the saved config path and existing credential resolution

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Stateless idempotency: PASS. The feature changes only scheduled launch mechanics and does not store transaction progress, cursors, last sync timestamps, or imported transaction state.
- CLI boundary: PASS. `scheduler install`, `scheduler status`, and scheduled `sync --quiet` remain non-interactive. The scheduled task remains Windows Task Scheduler based.
- Security: PASS. The scheduled task action and status output must remain token-free and sanitized. Credentials continue to resolve from secure storage or existing supported sources.
- API contracts: PASS. Monobank and Lunch Money adapters, statement limits, paging, and batch behavior are unchanged because the scheduled task still invokes normal sync.
- Import semantics: PASS. `status: "uncleared"`, tags, notes, external ids, duplicate-safe options, and `skip_balance_update` remain owned by the existing sync path.
- Operations: PASS. Existing lock handling, logs, notifications, partial-failure policy, and non-zero failure outcomes are preserved; scheduler action must propagate sync exit code.
- Tests: PASS. Planned tests focus on hidden scheduler registration, concise status, token safety, launcher creation, reinstall overwrite, and unchanged sync invocation semantics.

## Project Structure

### Documentation (this feature)

```text
specs/006-hidden-scheduled-sync/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    scheduler-cli.md
    scheduled-task.md
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
    runtime-files.ts
    tokens.ts
  credentials/
  notifications/
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
    scheduler/
  integration/
    scheduler/
    notifications/
```

**Structure Decision**: Keep the implementation in `src/scheduler/windows-task-scheduler.ts` and `src/commands/scheduler.command.ts`. Add any launcher file creation through existing runtime-file helpers so the scheduled action is short and user-profile scoped. Extend scheduler unit/integration tests rather than touching sync mapping/import tests, because sync behavior is reused unchanged.

## Post-Design Constitution Check

- Stateless idempotency: PASS. Design artifacts introduce only a scheduler launcher artifact, not transaction state.
- CLI boundary: PASS. Contracts preserve non-interactive scheduler commands and scheduled sync.
- Security: PASS. Contracts explicitly forbid tokens in the task action, launcher content, status output, logs, and CLI arguments.
- API contracts: PASS. Scheduled execution invokes the existing sync workflow and does not alter provider clients.
- Import semantics: PASS. Existing sync import semantics are unchanged by the launch wrapper.
- Operations: PASS. Data model and contracts cover hidden UI, notification-only visibility, exit-code propagation, reinstall, and status troubleshooting.
- Tests: PASS. Quickstart and contracts define verification for hidden task action, concise status, notifications, and no visible console windows.

## Complexity Tracking

No constitution violations are planned.
