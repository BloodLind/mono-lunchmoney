# CLI Contract: Node CLI Project Initialization

The CLI contract defines user-visible commands for the initialization feature.
Commands must be available from the installed `mono-lunchmoney` executable.

## Global Behavior

- `mono-lunchmoney --help` prints command discovery without credentials.
- `mono-lunchmoney help [topic]` prints detailed command and workflow help.
- `mono-lunchmoney --version` prints the package version.
- Commands that accept `--config` use it as an explicit config path override.
- Commands must not accept API tokens as options.
- Non-interactive failures return non-zero exit codes.
- Output and logs must sanitize secrets and sensitive financial identifiers.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Command completed successfully |
| 1 | User/config/input error |
| 2 | External scheduler or environment error |
| 3 | Lock or concurrent execution condition |

## Commands

### `mono-lunchmoney setup`

Initial setup command placeholder for this feature.

**Interactivity**: May prompt in the later setup feature.

**Initialization feature requirement**:

- Command is discoverable in help.
- If not fully implemented yet, it exits with a clear message that setup is not
  available in this feature slice.

### `mono-lunchmoney sync`

Sync command shell used by scheduler.

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--config <path>` | No | Explicit config path |
| `--quiet` | No | Suppress non-error console output for background use |
| `--dry-run` | No | Reserved for later sync feature |
| `--lookback-days <days>` | No | Reserved for later sync feature |

**Initialization feature requirement**:

- Runs without prompts.
- Returns non-zero on missing config or not-yet-implemented import behavior.
- Writes a sanitized error record for failures.

### `mono-lunchmoney backfill`

Backfill command shell for later historical imports.

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--config <path>` | No | Explicit config path |
| `--from <date>` | Yes for real backfill | Start date |
| `--to <date>` | Yes for real backfill | End date |

**Initialization feature requirement**:

- Command is discoverable in help.
- Runs without token arguments.
- If not fully implemented yet, exits with a clear not-yet-implemented message.

### `mono-lunchmoney config show`

Displays sanitized config and default runtime paths.

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--config <path>` | No | Explicit config path |

**Outputs**:

- Config path.
- Runtime log and lock paths.
- Whether config exists.
- Sanitized settings if config exists.

**Rules**:

- Must not print API tokens.
- Must not print full PANs, IBANs, or full account numbers.
- Must not create imported transaction state.

### `mono-lunchmoney help`

Displays detailed usage, workflow, and safety help.

**Arguments**:

| Argument | Required | Description |
|----------|----------|-------------|
| `topic` | No | One of `setup`, `sync`, `scheduler`, `config`, `backfill`, or `security` |

**Rules**:

- Default topic prints the product overview and recommended first-run flow.
- Topic help must explain current implementation status where a command is only
  a shell in this feature slice.
- Unknown topics return non-zero with available topics listed.

### `mono-lunchmoney scheduler install`

Registers the Windows background sync task.

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--daily-at <HH:mm>` | No | Local daily run time, default `20:00` |
| `--config <path>` | No | Explicit config path for scheduled sync |
| `--task-name <name>` | No | Task name, default `MonoLunchMoneySync` |

**Registered command shape**:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

**Rules**:

- Must run without token arguments.
- Must fail clearly on non-Windows systems.
- Must reject invalid time values.
- Must not register a command containing token-like values.

### `mono-lunchmoney scheduler status`

Reports task registration and last run state.

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--task-name <name>` | No | Task name, default `MonoLunchMoneySync` |

**Outputs**:

- Task exists: yes/no.
- Task name.
- Next run time, if available.
- Last run time, if available.
- Last result code, if available.
- Sanitized registered command, if available.

**Rules**:

- Missing task is a successful status result.
- Unexpected scheduler access failure returns non-zero.

### `mono-lunchmoney scheduler uninstall`

Removes the Windows background sync task.

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--task-name <name>` | No | Task name, default `MonoLunchMoneySync` |

**Rules**:

- Runs without prompts.
- Missing task is treated as already uninstalled.
- Unexpected scheduler access failure returns non-zero.

## Scheduler Command Safety Examples

Allowed:

```text
mono-lunchmoney sync --config "C:\Users\Ada\AppData\Roaming\mono-lunchmoney\config.json" --quiet
```

Rejected:

```text
mono-lunchmoney sync --mono-token "secret" --quiet
mono-lunchmoney sync --config "..." --lunchmoney-token "secret"
```

## Traceability

- Command registration: `src/cli.ts`, `src/cli/program.ts`, and
  `src/cli/command-registry.ts`.
- Runtime paths and sanitized config display: `src/config/paths.ts`,
  `src/config/config.loader.ts`, and `src/commands/config.command.ts`.
- Scheduler command safety and PowerShell wrappers:
  `src/scheduler/windows-task-scheduler.ts` and
  `src/commands/scheduler.command.ts`.
- Quiet sync failure visibility: `src/commands/sync.command.ts` and
  `src/logging/logger.ts`.
- Package validation: `scripts/validate-package.mjs`.
- Contract coverage: `tests/unit/cli`, `tests/unit/commands`,
  `tests/unit/scheduler`, `tests/integration/scheduler`, and
  `tests/integration/package`.
