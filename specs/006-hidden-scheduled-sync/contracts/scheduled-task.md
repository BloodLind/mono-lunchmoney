# Scheduled Task Contract: Hidden Background Mode

## Registered Task Invariants

- Task name defaults to `MonoLunchMoneySync` unless configured otherwise.
- Trigger is daily at the configured local time.
- Multiple instances use existing no-overlap behavior.
- Action must be short and token-free.
- Action must start a consoleless background launcher rather than the visible CLI/Node executable directly.

## Launcher Invariants

- Launcher file lives under the user's app runtime directory.
- Launcher runs the same underlying command represented by:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

- Launcher uses hidden window behavior.
- Launcher waits until sync exits.
- Launcher exits with the sync exit code.
- Launcher content contains no API tokens.

## Status Invariants

Status output must prefer this user-facing command:

```text
mono-lunchmoney sync --config "<configPath>" --quiet
```

Status output must not expose:

- long internal launcher code
- API tokens
- credential values
- full card numbers
- full IBANs
- full Monobank account identifiers

## Failure Invariants

- If launcher creation fails, scheduler install fails and does not silently install a visible-console fallback.
- If sync fails, scheduler last result reflects the sync failure where the platform allows exit code propagation.
- Sync logs remain the primary detailed diagnostic surface.
