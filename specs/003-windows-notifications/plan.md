# Implementation Plan: Windows Notifications

**Branch**: `003-windows-notifications` | **Date**: 2026-05-16 | **Spec**: `specs/003-windows-notifications/spec.md`
**Input**: Feature specification from `specs/003-windows-notifications/spec.md`

**Note**: This plan is produced by the `/speckit-plan` workflow and stops at
Phase 2 planning. Implementation tasks are generated separately.

## Summary

Add opt-in local Windows notification support to the existing CLI sync flow.
The feature persists static notification preferences in config, exposes
enable/disable/status control through existing setup/config surfaces, and routes
sync/backfill outcomes through a Windows-only notifier adapter. Notification
messages are sanitized with the existing masking rules, failures to show a
notification are logged for troubleshooting, and notification delivery never
changes the original sync/backfill result.

## Technical Context

**Language/Version**: TypeScript 5.9 on Node.js `>=20.19.0`.
**Primary Dependencies**: Existing Commander 14 CLI, Zod 4 validation, Vitest 4
tests, Node built-in `child_process`, `process.platform`, and file/log helpers;
no new runtime dependency is planned.
**Storage**: User config/log/lock files only under resolved runtime paths. Add
static notification settings to `config.json`; do not store notification history,
sync progress, transaction cursors, or imported transaction state.
**Testing**: Unit tests for notification config schema, event/message building,
sanitization, Windows/non-Windows delivery decisions, and notifier failure
handling; mocked integration tests for sync/backfill success, failure, partial
failure, lock-held, and disabled-notification paths.
**Target Platform**: Windows-friendly local CLI. Notification delivery is
Windows-only; non-Windows runs remain usable and skip delivery with a logged
diagnostic when notifications are enabled.
**Project Type**: Local CLI application.
**Performance Goals**: Notification handling adds no provider calls, no
long-running service, and should add less than one second to command completion
under normal Windows notification availability.
**Constraints**: Opt-in notifications, non-interactive sync/backfill/config
commands, no tokens in args/logs/config/notifications, sanitized financial
identifiers, and no hosted service or permanent daemon.
**Scale/Scope**: Single-user local notifications for sync-related outcomes:
success when explicitly enabled, failure, partial failure, lock already held,
and notification delivery failure logging.

## Constitution Check

*GATE: PASS before Phase 0 research. Re-check after Phase 1 design.*

- Stateless idempotency: PASS. Notification settings are static configuration
  and notification events are runtime-only; no imported transaction state,
  cursor, last transaction id, last synced timestamp, or notification history is
  persisted.
- CLI boundary: PASS. Setup may ask about notification preferences, while sync,
  backfill, scheduler status/uninstall, config show, and notification config
  controls remain non-interactive and suitable for scheduled/background use.
- Security: PASS. Notification messages use the same sanitization boundary as
  logs/config display and must not include tokens, full PANs, full IBANs, full
  account numbers, or long raw account identifiers.
- API contracts: PASS. The feature does not change Monobank or Lunch Money
  provider contracts, statement limits, import batches, or v1 adapter behavior.
- Import semantics: PASS. Notification behavior is after-outcome side effect
  only and does not change transaction mapping, `external_id`, tags, notes,
  review-pending status, or duplicate handling.
- Operations: PASS. Notification failures are logged but do not alter the
  original command exit outcome; lock-held and partial-failure outcomes remain
  visible and non-interactive.
- Tests: PASS. The task list must include tests for config defaults, opt-in and
  disabled behavior, sanitization, Windows-only delivery, notifier failures,
  quiet sync failures, partial failures, lock-held exits, and success
  notification preference.

## Project Structure

### Documentation (this feature)

```text
specs/003-windows-notifications/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    cli.md
    notification-adapter.md
```

### Source Code (repository root)

Existing relevant structure:

```text
src/
  commands/
    config.command.ts
    setup.command.ts
    sync.command.ts
    backfill.command.ts
  config/
    config.loader.ts
    config.model.ts
    config.writer.ts
    paths.ts
  logging/
    logger.ts
  sync/
    sync-runner.ts
  utils/
    masking.ts
```

Planned additions:

```text
src/
  notifications/
    notification-types.ts
    notification-config.ts
    notification-message.ts
    notification-service.ts
    windows-notifier.ts

tests/
  unit/
    notifications/
  integration/
    notifications/
```

Existing command/config/sync modules will be extended only at their boundaries:

```text
src/
  commands/
    config.command.ts
    setup.command.ts
    sync.command.ts
    backfill.command.ts
  config/
    config.loader.ts
    config.model.ts
  logging/
    logger.ts
  sync/
    sync-runner.ts
```

**Structure Decision**: Keep OS-specific notification delivery out of command
modules. Commands and sync/backfill orchestration emit notification events to a
small notification service, while `windows-notifier.ts` owns Windows delivery.
This keeps non-Windows behavior, sanitization, and failure policy testable with
mocked notifiers.

## Complexity Tracking

No constitution violations are planned.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Phase 0: Research

Research output is captured in `specs/003-windows-notifications/research.md`.
All technical unknowns are resolved with local dependency choices and mocked
Windows notification delivery for tests.

## Phase 1: Design And Contracts

Design output is captured in:

- `specs/003-windows-notifications/data-model.md`
- `specs/003-windows-notifications/contracts/cli.md`
- `specs/003-windows-notifications/contracts/notification-adapter.md`
- `specs/003-windows-notifications/quickstart.md`

Agent context is updated in `AGENTS.md` to reference this plan.

## Post-Design Constitution Check

*GATE: PASS after Phase 1 design.*

- The data model adds only static notification preferences and transient
  notification events/messages/results; no imported transaction progress or
  notification history is persisted.
- CLI contracts keep sync/backfill/config notification controls non-interactive
  and preserve token-free scheduled commands.
- Notification adapter contracts isolate Windows-only delivery behind an
  injectable interface and define non-Windows behavior as a skipped delivery,
  not a sync failure.
- Quickstart requires opt-in notification settings, sanitized messages, and
  log-based troubleshooting for delivery failures.
- Test guidance covers opt-in/disabled behavior, success/failure preferences,
  sanitization, lock-held outcomes, notifier failures, and unchanged
  sync/backfill exit semantics.
