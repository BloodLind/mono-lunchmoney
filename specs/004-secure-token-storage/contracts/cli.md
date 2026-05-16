# CLI Contract: Secure Token Storage

## `mono-lunchmoney setup`

### Behavior

- Shows token source guidance when credentials are missing.
- Reads existing protected credentials when available.
- Reads existing environment variables as compatibility input when protected credentials are missing.
- Validates both provider credentials before account mapping.
- Saves valid tokens to protected storage by default unless the user explicitly chooses setup-only temporary use.
- Never writes full token values to `config.json`.

### Acceptance Output

- Shows provider credential source as `protected storage`, `environment`, or `entered now`.
- Shows token obtainment links when input is required.
- Does not echo entered token values.
- Prints a sanitized account mapping summary.

## `mono-lunchmoney credentials status`

### Behavior

- Non-interactive.
- Reports whether Monobank and Lunch Money credentials are available.
- Reports safe source and health state.
- Does not validate against external providers unless an explicit validation flag is added later.

### Example

```text
Credential Status
=================

  Monobank:     ready (protected storage)
  Lunch Money:  ready (protected storage)
```

## `mono-lunchmoney credentials set`

### Behavior

- Interactive by default.
- Prompts for missing or replacement tokens without echoing values when possible.
- Validates entered tokens before saving.
- Replaces existing saved credential only after successful validation.
- Does not accept token values as command-line options.

### Options

```text
--provider <monobank|lunchmoney|all>
--force
```

## `mono-lunchmoney credentials remove`

### Behavior

- Removes saved protected credentials for one or all providers.
- Does not modify account mappings or scheduler configuration.
- Requires confirmation unless `--yes` is supplied.

### Options

```text
--provider <monobank|lunchmoney|all>
--yes
```

## Non-Interactive Commands

Applies to:

- `mono-lunchmoney sync`
- `mono-lunchmoney backfill`
- `mono-lunchmoney scheduler status`
- scheduled `sync --quiet`

### Behavior

- Must not prompt for token input.
- Resolve provider tokens from protected storage first.
- May use environment variables as compatibility source when protected credentials are missing.
- If credentials are missing, invalid, or inaccessible, exit non-zero with a sanitized recovery message.

## Token Safety Contract

- No command accepts token values as CLI options.
- No command prints full token values.
- Scheduler command output and registered task arguments contain no token values.
- `config show` contains credential presence at most, never token contents.
