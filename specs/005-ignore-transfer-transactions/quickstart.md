# Quickstart: Ignore Transfer Transactions

## Prerequisites

- Node.js `>=20.19.0`.
- Existing protected or environment-based Monobank and Lunch Money tokens.
- At least two Monobank sources where one should be imported and another should be used only for ignored transfer filtering.

## Configure Ignored Transfer Sources

Run setup or reconfigure:

```powershell
mono-lunchmoney setup --reconfigure
```

During setup:

- Select the Monobank account/card that should be imported into Lunch Money.
- Map the imported source to an existing or new Lunch Money manual account.
- Select the Monobank account/card whose related transfer transactions should be ignored.
- For sources that should be skipped but not used for transfer filtering, answer
  `no` to import tracking and `no` to ignored transfer source selection.
- Confirm the final summary shows ignored transfer sources separately from mappings.

Expected summary shape:

```text
Ignored Transfer Sources
  - Mono White UAH ****2222 (UAH)

Mappings
  - Mono Black UAH ****1111 -> Lunch Money Black UAH
```

## Verify Saved Config

```powershell
mono-lunchmoney config show
```

Expected result:

- `ignoredMonobankAccounts` appears separately from `accounts`.
- Account ids are masked.
- PANs remain masked.
- Full IBANs and token values do not appear.

## Dry-Run Sync

```powershell
mono-lunchmoney sync --dry-run
```

Expected result:

- Sync fetches mapped imported accounts only.
- Transfers related to ignored sources are counted as skipped.
- Unrelated transactions remain eligible and are mapped in dry-run output/progress.
- If every fetched transaction is skipped by ignored transfer rules, sync reports
  `submitted 0 eligible transactions` and does not submit an empty Lunch Money batch.

## Real Sync

```powershell
mono-lunchmoney sync
```

Verify in Lunch Money:

- The ignored transfer transaction does not appear in the imported account.
- Unrelated transactions still appear.
- Imported transactions remain uncleared and tagged as configured.
- Running sync again does not duplicate eligible transactions.

## Backfill Check

```powershell
mono-lunchmoney backfill --from 2026-01-01 --to 2026-01-31 --dry-run
```

Expected result:

- Backfill uses the same ignored transfer filtering as sync.
- Re-running the same command reports the same ignored-transfer behavior without local transaction progress state.

## Manual Safety Checks

- Confirm logs show skipped counts but no full source identifiers.
- Confirm `config show` does not reveal full PANs, full IBANs, or tokens.
- Confirm skipped-but-not-ignored setup sources are not present in
  `ignoredMonobankAccounts`.
- Confirm a transaction with only an ambiguous transfer description is not skipped unless it matches safe ignored-source metadata.
