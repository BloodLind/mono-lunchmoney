# CLI Contract

## Global Rules

- Binary name: `mono-lunchmoney`.
- Default config path: `%APPDATA%\mono-lunchmoney\config.json`.
- Commands accepting `--config <path>` must resolve it to an absolute path.
- Tokens must be resolved from environment or secure user storage, never from
  positional arguments or logged options.
- Exit codes:
  - `0`: success
  - `1`: user/config/validation error
  - `2`: external provider or scheduler error
  - `3`: lock already held

## `mono-lunchmoney setup`

**Interactive**: yes.

**Inputs**:

- Environment: `MONO_TOKEN`, `LUNCHMONEY_TOKEN`.
- Options:
  - `--config <path>` may be added by implementation for explicit output path.
  - `--reconfigure` may be added to update existing mappings.

**Behavior**:

1. Validate both provider tokens before saving config.
2. Display masked Monobank sources.
3. Ask track/skip per source.
4. For each tracked source, map to existing Lunch Money manual account or create
   a new one.
5. Ask for global/default tag and per-account override where needed.
6. Save sanitized config without tokens.
7. Print tracked mapping summary with masked identifiers.

**Failure contract**:

- Missing/invalid tokens exit `1` or `2` with a readable message.
- User cancellation exits `1` without writing partial config unless explicitly
  confirmed.

## `mono-lunchmoney sync`

**Interactive**: no.

**Inputs**:

- Options:
  - `--config <path>`
  - `--quiet`
  - `--dry-run`
  - `--lookback-days <days>` where `days` is 1..31
- Environment: `MONO_TOKEN`, `LUNCHMONEY_TOKEN`.

**Behavior**:

1. Load and validate config.
2. Require at least one enabled mapping.
3. Acquire `sync.lock`.
4. For each enabled mapping, fetch recent Monobank transactions for the
   effective lookback window.
5. Map transactions to Lunch Money import objects with deterministic
   `external_id`, `status: "uncleared"`, tag, asset id, and compact notes.
6. Import in chunks of at most 500 unless `--dry-run` is set.
7. Log per-account fetched/submitted/imported counts.
8. Release lock.

**Failure contract**:

- Lock already held exits `3`.
- Missing config/tokens exit `1`.
- External provider failures exit `2`.
- If one account fails, continue with later accounts when safe, then exit
  non-zero after all possible work completes.

## `mono-lunchmoney backfill --from <YYYY-MM-DD> --to <YYYY-MM-DD>`

**Interactive**: no.

**Inputs**:

- Required options: `--from`, `--to`.
- Optional: `--config <path>`, `--quiet`, `--dry-run`.
- Environment: `MONO_TOKEN`, `LUNCHMONEY_TOKEN`.

**Behavior**:

1. Validate date range.
2. Split range into windows no larger than Monobank's 31-day provider limit.
3. Process each enabled mapping and each window through the same fetch, map,
   import, lock, and logging pipeline as sync.
4. Repeated runs must remain duplicate-free through the same `external_id`
   builder.

## `mono-lunchmoney scheduler install --daily-at <HH:mm>`

**Interactive**: args-based; may prompt only if required options are absent in a
future version.

**Inputs**:

- Options:
  - `--daily-at <HH:mm>`, default `20:00`
  - `--task-name <name>`, default `MonoLunchMoneySync`
  - `--config <path>`, default runtime config path

**Registered command**:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

**Rules**:

- Must not include API tokens.
- Must use Windows Task Scheduler.
- Must ignore a new instance when one is already running.
- Should start when available and allow battery starts.

## `mono-lunchmoney scheduler status`

**Interactive**: no.

**Inputs**:

- Optional `--task-name <name>`.

**Output**:

- Task exists: yes/no.
- Task name.
- Next run time.
- Last run time.
- Last result code.
- Registered command, sanitized.

## `mono-lunchmoney scheduler uninstall`

**Interactive**: no.

**Inputs**:

- Optional `--task-name <name>`.

**Behavior**:

- Remove the scheduled task if present.
- Treat already-absent task as successful.

## `mono-lunchmoney config show`

**Interactive**: no.

**Inputs**:

- Optional `--config <path>`.

**Output**:

- Config path, log paths, lock path.
- Sanitized config summary.
- No tokens, full PANs, full IBANs, or full account numbers.
