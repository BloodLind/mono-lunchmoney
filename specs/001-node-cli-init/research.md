# Research: Node CLI Project Initialization

## Decision: Use TypeScript on Node.js active LTS

**Rationale**: The product requirements prefer TypeScript and Node.js, and the
tool must be installable as a CLI for other users. Targeting the active LTS line
keeps installation predictable while avoiding short-lived runtime versions.

**Alternatives considered**:

- Plain JavaScript: simpler build, but weaker contracts for config, scheduler
  payloads, and command definitions.
- A packaged native executable first: useful later, but a Node package is the
  direct distribution model requested for this feature.

## Decision: Use Commander for command routing

**Rationale**: The command surface is hierarchical and stable:
`setup`, `sync`, `backfill`, `scheduler install/status/uninstall`, and
`config show`. Commander maps cleanly to this structure and provides help output
without requiring credentials or configuration.

**Alternatives considered**:

- Hand-rolled argument parsing: fewer dependencies, but higher risk of
  inconsistent help, option parsing, and exit behavior.
- Yargs: capable, but Commander is smaller and sufficient for this command set.

## Decision: Use Zod for runtime validation

**Rationale**: Config files, scheduler options, times, and command arguments need
clear validation and readable errors. Zod gives a single validation surface that
can be used by config loading, CLI option parsing, and tests.

**Alternatives considered**:

- JSON Schema only: good for file validation, but less ergonomic for CLI option
  validation and inferred TypeScript types.
- Manual validation: lower dependency count, but easier to drift across modules.

## Decision: Package as an npm-installable CLI command

**Rationale**: Users should be able to install the tool and run
`mono-lunchmoney` without invoking source files. Package metadata must define
the command name, runtime engine, build output, license, description, and files
included in the package.

**Alternatives considered**:

- Local-only scripts: useful during development, but not installable by other
  people as a CLI.
- Windows executable only: possible later, but less aligned with the requested
  Node distribution workflow.

## Decision: Scheduler management uses Windows Task Scheduler through PowerShell

**Rationale**: The project is Windows-friendly and the product spec requires
Windows Task Scheduler. PowerShell exposes task registration, status, and
removal without requiring a hosted service or daemon.

**Alternatives considered**:

- Cron or cross-platform schedulers: not the target for first version.
- Long-running background daemon: explicitly outside the constitution and
  product scope.

## Decision: Scheduled command invokes the installed CLI with config path

**Rationale**: The registered job should survive working-directory changes and
must not expose tokens. The command must call quiet sync with a config path and
rely on environment or secure storage for credentials.

**Alternatives considered**:

- Invoke a repository source path: not appropriate for an installed CLI.
- Pass tokens in scheduler arguments: rejected by security requirements.

## Decision: Failure notification is split from failure visibility

**Rationale**: This feature must ensure failed background runs are discoverable
through scheduler status and sanitized error logs. Active notifications are
important but explicitly requested as a separate issue, so this plan records the
boundary without implementing alerts.

**Alternatives considered**:

- Implement desktop notifications now: expands platform surface and is outside
  the requested initialization scope.
- Ignore notification needs entirely: would lose an important follow-up and make
  background failures harder to prioritize later.

## Decision: Tests focus on installability, command contracts, scheduler safety

**Rationale**: This feature's risk is not transaction mapping; it is the CLI
surface, package installation, path resolution, scheduler registration command,
and no-secret behavior. Tests should cover those directly.

**Alternatives considered**:

- Full API integration tests: belongs to the sync feature.
- Manual-only scheduler validation: too risky because token leakage and quoting
  errors are easy to miss.
