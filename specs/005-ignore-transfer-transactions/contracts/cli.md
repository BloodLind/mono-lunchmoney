# CLI Contract: Ignore Transfer Transactions

## setup

Command:

```powershell
mono-lunchmoney setup
mono-lunchmoney setup --reconfigure
```

Required behavior:

- Setup lists discovered Monobank accounts/cards with masked identifiers.
- For each source, setup lets the user decide whether it should be imported into Lunch Money.
- Setup also lets the user decide whether the source should be used as an ignored transfer source.
- The ignored transfer source choice is saved separately from Lunch Money mappings.
- Setup summary prints:
  - config path
  - ignored transfer source count
  - tracked mapping count
  - sanitized ignored source list when non-empty
- Setup must not print or store tokens, full PANs, full IBANs, or full account identifiers.

Example output shape:

```text
Ignored Transfer Sources
  - Mono White UAH ****2222 (UAH)

Mappings
  - Mono Black UAH ****1111 -> Lunch Money Black UAH
```

## config show

Command:

```powershell
mono-lunchmoney config show
mono-lunchmoney config show --config "C:\path\config.json"
```

Required behavior:

- Runs without prompts.
- Shows ignored transfer sources as a separate sanitized config section or JSON field.
- Shows whether each ignored source has safe matcher metadata, such as `maskedPan` or `hasIbanMatcher`.
- Does not show full source account ids, full PANs, full IBANs, or tokens.

## sync

Command:

```powershell
mono-lunchmoney sync
mono-lunchmoney sync --dry-run
mono-lunchmoney sync --quiet
```

Required behavior:

- Runs without prompts.
- Excludes transactions on imported accounts when they confidently match an enabled ignored transfer source.
- Leaves unrelated transactions eligible for normal Lunch Money import.
- Uses existing lock, logging, idempotency, tag, notes, status, and duplicate-safe import behavior for eligible transactions.
- Reports skipped ignored-transfer counts without sensitive identifiers.
- Fails clearly if config has no enabled syncable mappings.

Expected progress/log shape:

```text
Account Lunch Money Black UAH: fetched 12 transactions
Account Lunch Money Black UAH: skipped 2 transactions related to ignored Monobank sources
Account Lunch Money Black UAH: sent 10 transactions to Lunch Money
```

## backfill

Command:

```powershell
mono-lunchmoney backfill --from 2026-01-01 --to 2026-01-31
mono-lunchmoney backfill --from 2026-01-01 --to 2026-01-31 --dry-run
```

Required behavior:

- Runs without prompts except normal command-line validation.
- Uses the same ignored transfer filtering as sync.
- Splits requested ranges into existing valid statement windows.
- Re-running the same backfill excludes the same ignored transfer transactions without local transaction state.

## Exit And Error Behavior

- Missing or invalid config: non-zero user error.
- No enabled syncable account mappings: non-zero user error.
- Account-level provider failure: preserve existing partial-failure behavior and non-zero final result when any account fails.
- All fetched transactions excluded for an otherwise valid account: report zero eligible transactions; this is not an account failure by itself.
