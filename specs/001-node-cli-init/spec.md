# Feature Specification: Node CLI Project Initialization

**Feature Branch**: `001-node-cli-init`
**Created**: 2026-05-15
**Status**: Draft
**Input**: User description: "Based on AGENTS.md provide initialization spec what is required for this project. I want to use node and other people should have possiblity to install it as cli tool which has scedule job creation to work on background. Also it's important to rise some notifications about issues exceptions if it on background (separate issue)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize Installable CLI Project (Priority: P1)

As a project maintainer, I want the repository initialized as a Node-based
installable command-line tool so other users can install it and run the documented
commands without cloning project internals or invoking source files directly.

**Why this priority**: The bridge must be usable by other people as a CLI tool
before setup, sync, or scheduling workflows can be delivered reliably.

**Independent Test**: From a clean checkout or packaged build, install the tool
through the documented Node package workflow and confirm the command is available
from a terminal, shows help, and exposes the expected top-level commands.

**Acceptance Scenarios**:

1. **Given** a clean machine with the documented runtime prerequisites, **When**
   the user installs the package, **Then** the `mono-lunchmoney` command is
   available from a new terminal session.
2. **Given** the installed command, **When** the user runs help, **Then** the help
   lists setup, sync, scheduler, backfill, and config commands with concise usage.
3. **Given** a missing or unsupported runtime prerequisite, **When** the user
   attempts installation or first run, **Then** the user receives a clear message
   explaining what is missing.

---

### User Story 2 - Provide First-Run Project Defaults (Priority: P1)

As a first-time user, I want the installed CLI to know where configuration,
logs, and lock files belong by default so setup and background sync work without
manual file placement.

**Why this priority**: Predictable user-level paths are required for safe
configuration, scheduled execution, and troubleshooting.

**Independent Test**: Run non-destructive commands on a fresh profile and verify
that default paths resolve under the current user's profile, directories are
created only when needed, and displayed paths contain no secrets.

**Acceptance Scenarios**:

1. **Given** no existing configuration directory, **When** the user starts setup
   or another command that needs storage, **Then** the tool creates user-level
   directories for configuration and logs.
2. **Given** the user requests configuration display, **When** no config exists,
   **Then** the tool reports the expected config path and next setup step without
   creating transaction state.
3. **Given** a command runs in quiet or scheduled mode, **When** it needs logs or
   a lock file, **Then** it uses the same user-level defaults documented for the
   CLI.

---

### User Story 3 - Install Background Schedule (Priority: P2)

As a Windows user, I want the installed CLI to create a daily background schedule
that runs sync quietly using saved configuration so imports can happen without a
permanent server.

**Why this priority**: Background execution is part of the expected user flow,
but it depends on the CLI being installed and paths being stable.

**Independent Test**: Install a daily schedule for a chosen time, inspect the
registered background job, verify the command uses the installed CLI and saved
config path, then uninstall it.

**Acceptance Scenarios**:

1. **Given** the CLI is installed and setup has saved config, **When** the user
   installs a daily schedule, **Then** a background job is registered for the
   requested time.
2. **Given** the registered background job, **When** the user inspects it, **Then**
   it invokes quiet sync with a config path and contains no API tokens.
3. **Given** a registered background job, **When** the user uninstalls it,
   **Then** the job is removed and no future background sync is scheduled.

---

### User Story 4 - Package and Document Distribution (Priority: P2)

As a project maintainer, I want release and installation instructions that
explain prerequisites, local development, package installation, command usage,
and scheduler setup so other people can install the tool consistently.

**Why this priority**: Installability is incomplete without clear instructions
for both maintainers and users.

**Independent Test**: Follow the README from a clean environment and verify that
installation, help output, dry configuration inspection, and scheduler status can
be completed without additional undocumented steps.

**Acceptance Scenarios**:

1. **Given** a new user reading the README, **When** they follow installation
   steps, **Then** they can install and run the CLI help command.
2. **Given** a maintainer preparing a release, **When** they follow the release
   notes, **Then** they can produce an installable package artifact.
3. **Given** a user wants background sync, **When** they follow scheduler
   instructions, **Then** they understand that credentials are configured outside
   scheduled command arguments.

---

### User Story 5 - Surface Background Failures for Follow-Up Notifications (Priority: P3)

As a user relying on background sync, I want failures to be discoverable through
status and logs now, and I want active notifications tracked as a separate
follow-up so missed background exceptions are not ignored.

**Why this priority**: Active notifications are important, but the first
initialization feature only needs to preserve the failure information and define
the follow-up boundary.

**Independent Test**: Simulate a failed scheduled run and verify the failure is
visible through scheduler status and sanitized logs, with active desktop or other
push notifications explicitly documented as out of scope for this feature.

**Acceptance Scenarios**:

1. **Given** a background sync fails, **When** the user checks scheduler status,
   **Then** the last result indicates failure or a non-success state.
2. **Given** a background sync fails, **When** the user opens the error log,
   **Then** the log includes a readable sanitized reason.
3. **Given** the user asks for active notifications, **When** they read the
   initialization scope, **Then** they see that active issue and exception
   notifications are a separate feature.

---

### Edge Cases

- The CLI is installed globally but the command is not on the user's path.
- The CLI is run from a different working directory than the project checkout.
- A user installs a newer version over an existing installed version.
- The default user-level config directory does not exist.
- The default config path is overridden for a command or scheduler install.
- Scheduler install is attempted before setup has produced a valid config.
- Scheduler install is attempted on a non-Windows environment.
- The scheduled job command would exceed shell quoting or path rules.
- A scheduled run fails while no terminal window is visible.
- Logs or status contain sensitive values that must be masked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST be initialized as a Node-based installable CLI
  package with a stable `mono-lunchmoney` command name.
- **FR-002**: The installed command MUST expose help and command discovery
  without requiring credentials or a config file.
- **FR-003**: The installed command MUST expose setup, sync, scheduler, backfill,
  and config command groups.
- **FR-004**: The CLI MUST resolve default config, log, error log, and lock file
  locations under the current user's profile.
- **FR-005**: The CLI MUST support an explicit config path option for commands
  that need saved configuration.
- **FR-006**: The CLI MUST create user-level runtime directories only when a
  command needs to write config, logs, or lock files.
- **FR-007**: The initialization MUST include documentation for runtime
  prerequisites, install options, local development, release packaging, setup,
  sync, scheduler, and troubleshooting.
- **FR-008**: The scheduler install command MUST register a daily Windows
  background job that invokes the installed CLI command in quiet sync mode.
- **FR-009**: The scheduler install command MUST allow the user to choose the
  daily run time and MUST default to the project's standard daily time when not
  specified.
- **FR-010**: The registered background job MUST use a saved config path and
  MUST NOT include API tokens or other credentials in command arguments.
- **FR-011**: Scheduler status MUST report whether the job exists, its name,
  next run, last run, last result, and registered command.
- **FR-012**: Scheduler uninstall MUST remove the registered background job
  without requiring credentials or prompts.
- **FR-013**: Background run failures MUST be discoverable through scheduler
  status and sanitized error logs.
- **FR-014**: Active user notifications for background issues and exceptions
  MUST be documented as a separate follow-up feature, not delivered by this
  initialization feature.
- **FR-015**: Installation, scheduler, status, and config-display workflows MUST
  never print, store, or register API tokens.
- **FR-016**: The CLI MUST return non-zero exit results for failed non-interactive
  commands so background job status can reflect failure.
- **FR-017**: The package MUST include enough metadata for users to identify the
  tool purpose, license, command name, and supported platform expectations.

### Constitution-Aligned Requirements

- **CAR-001**: The feature MUST NOT introduce a local transaction database or
  imported transaction cursor as source of truth.
- **CAR-002**: This initialization feature MUST preserve space for deterministic
  import identity but MUST NOT implement transaction import state storage.
- **CAR-003**: Non-setup commands in scope MUST run without prompts.
- **CAR-004**: Tokens MUST NOT be stored in plain config, passed as arguments,
  printed, or logged.
- **CAR-005**: Sensitive account identifiers MUST be masked in console output,
  config display, and logs.
- **CAR-006**: Statement fetching behavior is outside this initialization feature
  except that scheduled sync must call the normal sync command.
- **CAR-007**: Transaction import behavior is outside this initialization feature
  except that the CLI must expose commands needed by later import flows.
- **CAR-008**: Scheduler behavior in scope MUST use Windows Task Scheduler and
  MUST NOT include API tokens in the registered command.

### Key Entities *(include if feature involves data)*

- **CLI Package**: The installable distribution users install to obtain the
  `mono-lunchmoney` command.
- **CLI Command**: A user-facing command or command group exposed by the
  installed tool, including setup, sync, scheduler, backfill, and config display.
- **Runtime Path Set**: The user-level config, sync log, error log, and lock file
  locations used by the installed CLI.
- **Background Schedule**: A daily Windows background job that invokes quiet sync
  using the installed CLI and saved config path.
- **Scheduler Status**: The user-visible state of the background job, including
  existence, timing, result, and registered command.
- **Failure Record**: Sanitized status and log information produced when a
  background run fails.
- **Notification Follow-Up**: A separate future feature for active alerts about
  background issues and exceptions.

### Scope Boundaries

- This feature covers project initialization, installable CLI distribution,
  runtime paths, scheduler command registration, status/uninstall behavior, and
  documentation needed for others to install and run the CLI.
- This feature does not cover Monobank account setup, transaction mapping,
  transaction import correctness, duplicate prevention, or historical backfill
  behavior beyond exposing command entry points.
- This feature does not deliver active desktop, email, mobile, or other push
  notifications for background failures. It must leave failures visible through
  status and logs and identify active notifications as a separate follow-up.
- This feature does not introduce any hosted service, daemon, GUI, or local
  transaction database.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can install the CLI and run the help command in under
  five minutes after reading the installation instructions.
- **SC-002**: The installed command exposes 100% of the required command groups:
  setup, sync, scheduler, backfill, and config.
- **SC-003**: Scheduler install, status, and uninstall can be completed from the
  installed CLI without invoking project source paths directly.
- **SC-004**: The registered background job command contains zero API tokens in
  validation samples.
- **SC-005**: A simulated failed background run is visible through scheduler
  status and sanitized error logs.
- **SC-006**: The README enables a maintainer to create an installable package
  artifact and a user to install it without undocumented steps.
- **SC-007**: Installation and first-run validation samples create no imported
  transaction state.

## Assumptions

- The CLI is distributed through the Node package ecosystem because the user
  selected Node as a project requirement.
- The supported background scheduler for the first version is Windows Task
  Scheduler.
- The command name is `mono-lunchmoney`.
- API tokens are supplied outside scheduled commands, saved config, and logs.
- Active notifications for background issues and exceptions will be specified in
  a later feature or issue.
