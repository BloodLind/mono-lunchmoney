# Implementation Plan: Secure Token Storage

**Branch**: `004-secure-token-storage` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-secure-token-storage/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace environment-variable-first token persistence with protected, user-scoped credential storage that setup can populate and all non-interactive commands can reuse. The implementation will add a credential storage boundary, interactive setup migration/saving, credential management CLI commands, sanitized status output, and tests proving tokens are not stored in config, logs, scheduler commands, or ordinary runtime files.

## Technical Context

**Language/Version**: TypeScript + Node.js `>=20.19.0`
**Primary Dependencies**: Existing Commander CLI, Zod validation, Vitest tests, built-in Node APIs, Windows PowerShell/.NET for protected user secret operations; no new runtime package unless implementation proves a built-in path is insufficient
**Storage**: Static app config/log/lock files remain under `%APPDATA%\mono-lunchmoney`; provider tokens are stored as user-protected encrypted credential records, not in config and not as persistent plain environment values
**Testing**: Unit tests with mocked credential store plus integration tests for setup, sync/backfill token resolution, credential commands, scheduler command safety, and sanitization
**Target Platform**: Windows-friendly local CLI and Windows Task Scheduler; saved credentials are expected to be reusable by the same Windows user context that ran setup
**Project Type**: Local CLI application
**Performance Goals**: Credential read/write operations complete within normal CLI startup time; no additional Monobank or Lunch Money calls beyond existing validation/import flows
**Constraints**: Stateless transaction idempotency, non-interactive sync/backfill/scheduler, no tokens in args/logs/config, no plain persistent fallback, no hosted service
**Scale/Scope**: Two provider credentials for one local user profile: Monobank and Lunch Money; migration from existing environment variables supported as compatibility input

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Stateless idempotency: PASS. This feature touches credential persistence only and does not add a transaction database, cursor, last sync timestamp, or imported transaction state.
- CLI boundary: PASS. `setup` and explicit credential-management commands may be interactive; `sync`, `backfill`, scheduler status/uninstall, and config show remain non-interactive.
- Security: PASS. The plan removes persistent environment-variable storage as the preferred setup outcome and stores reusable tokens only in protected user-scoped credential storage. Tokens remain absent from config, logs, scheduler commands, and CLI arguments.
- API contracts: PASS. Existing Monobank and Lunch Money adapters remain isolated. Token resolution changes occur before client construction and do not alter provider API behavior.
- Import semantics: PASS. Mapping, `external_id`, tags, notes, and duplicate-safe import options are unchanged.
- Operations: PASS. Existing lock/log/partial-failure behavior remains; credential failures produce sanitized non-interactive user errors.
- Tests: PASS. New tests cover credential storage, migration, command output sanitization, setup saving, non-interactive resolution, and scheduler token safety without weakening existing sync tests.

## Project Structure

### Documentation (this feature)

```text
specs/004-secure-token-storage/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    cli.md
    credential-store.md
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
    credentials.command.ts
  config/
    config.model.ts
    config.loader.ts
    config.writer.ts
    paths.ts
    runtime-files.ts
    tokens.ts
  credentials/
    credential-store.ts
    protected-credential-store.ts
    credential-types.ts
  monobank/
  lunchmoney/
  mapping/
  scheduler/
  locking/
  logging/
  notifications/
  sync/
  utils/
    masking.ts
```

```text
tests/
  unit/
    credentials/
    config/
    commands/
  integration/
    setup/
    sync/
    backfill/
    scheduler/
    credentials/
```

**Structure Decision**: Add a small `src/credentials/` module for protected credential storage and a dedicated `credentials` command group for user-facing credential management. Keep token resolution in `src/config/tokens.ts` as the single provider-token entry point so existing commands change minimally.

## Post-Design Constitution Check

- Stateless idempotency: PASS. Design artifacts do not introduce transaction persistence.
- CLI boundary: PASS. Contracts preserve non-interactive sync/backfill/scheduler behavior and isolate interactivity to setup or credential-management commands.
- Security: PASS. Data model and contracts explicitly forbid full token display, config storage, logs, scheduler arguments, and plain persistent fallback.
- API contracts: PASS. Provider clients remain unchanged except for token source resolution.
- Import semantics: PASS. Existing mapping/import behavior is out of scope and preserved.
- Operations: PASS. Quickstart covers setup, status, non-interactive reuse, scheduler verification, rotation, and removal.
- Tests: PASS. Planned tests cover credential storage, status, setup saving, non-interactive resolution, scheduler token safety, and sanitization.

## Complexity Tracking

No constitution violations are planned.
