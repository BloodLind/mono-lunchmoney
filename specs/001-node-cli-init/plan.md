# Implementation Plan: Node CLI Project Initialization

**Branch**: `001-node-cli-init` | **Date**: 2026-05-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-node-cli-init/spec.md`

## Summary

Initialize Mono Lunch Bridge as an installable Node-based CLI with a stable
`mono-lunchmoney` command, user-profile runtime paths, documented packaging and
installation flow, and Windows Task Scheduler management for daily background
sync. This feature establishes the CLI and scheduler shell needed by the later
Monobank/Lunch Money sync feature, while leaving active background notifications
as a separate follow-up.

## Technical Context

**Language/Version**: TypeScript with Node.js active LTS; package engine should
target the active LTS line used at implementation time.  
**Primary Dependencies**: Commander for CLI routing, Zod for config/runtime
validation, built-in Node filesystem/process modules, PowerShell integration for
Windows Task Scheduler, Vitest for tests.  
**Storage**: User config/log/lock files only; no local transaction database and
no imported transaction state.  
**Testing**: Unit tests for command parsing/path resolution/sanitization and
mocked integration tests for scheduler command generation and status parsing.  
**Target Platform**: Windows-friendly local CLI, installable through the Node
package ecosystem, with Windows Task Scheduler support.  
**Project Type**: Local CLI application.  
**Performance Goals**: CLI help/status commands complete in under 2 seconds on
a normal workstation; scheduler command generation remains deterministic.  
**Constraints**: Non-interactive scheduler/status/uninstall/config-display
flows; no tokens in CLI arguments, scheduled commands, logs, or config display.  
**Scale/Scope**: Single-user local installation for personal budgeting;
multiple mapped accounts are supported later by the sync feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Stateless idempotency: PASS. This feature creates CLI/package/scheduler
  infrastructure only and explicitly avoids local transaction databases,
  transaction cursors, and imported transaction state.
- CLI boundary: PASS. The design remains a local CLI. Setup may be interactive
  later; scheduler status/uninstall and config display are non-interactive.
- Security: PASS. Runtime paths and scheduler commands are designed around
  environment/secure storage token resolution; tokens are never accepted as CLI
  arguments or embedded in scheduled tasks.
- API contracts: PASS. External Monobank and Lunch Money behavior is out of
  scope except that stable command entry points are exposed for later adapter
  work.
- Import semantics: PASS. Transaction import is out of scope; the CLI exposes
  the future command surface without storing transaction state.
- Operations: PASS. Scheduler status, sanitized logs, failure exit codes, and
  follow-up notification boundaries are included.
- Tests: PASS. Planned tests cover command discovery, runtime paths, scheduler
  command token safety, non-interactive exits, status parsing, and sanitized
  failure records.

Post-design re-check: PASS. Phase 1 artifacts preserve the same boundaries and
introduce no constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-node-cli-init/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    cli-contract.md
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
  scheduler/
    windows-task-scheduler.ts
  locking/
    lock-file.ts
  logging/
    logger.ts
  utils/
    masking.ts

tests/
  unit/
    cli/
    config/
    scheduler/
  integration/
    scheduler/
```

**Structure Decision**: Use the constitution's single local CLI structure, but
for this initialization feature implement only the command shell, runtime paths,
scheduler management, logging/sanitization helpers, package metadata, and docs.
Monobank/Lunch Money adapters and transaction mapping belong to later sync
feature work.

## Complexity Tracking

No constitution violations are required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
