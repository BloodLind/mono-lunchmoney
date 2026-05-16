# Data Model: Ignore Transfer Transactions

## IgnoredTransferSource

Represents a Monobank account/card selected by the user as a source whose related transfer transactions should be excluded from imports.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| enabled | boolean | yes | Disabled records are ignored without deleting the saved choice |
| monoAccountId | string | yes | Stored for source identity and syncable-account exclusion checks; masked in output |
| monoDisplayName | string | yes | Safe display name from setup, sanitized before printing |
| monoType | string | no | Monobank source type when available |
| monoCurrencyCode | number | yes | Original Monobank currency code |
| currency | string | yes | Normalized currency code |
| maskedPan | string | no | Masked card/PAN value used for safe matching and display |
| ibanSha256 | string | no | SHA-256 hash of source IBAN when available; full IBAN is not stored |

### Validation Rules

- `monoAccountId`, `monoDisplayName`, and `currency` must be non-empty.
- `ibanSha256`, when present, must be a 64-character SHA-256 hex value.
- Full PAN, full IBAN, and API tokens must not be stored in this entity.
- Display output must mask `monoAccountId` and sanitize `monoDisplayName`.

## ImportedAccountMapping

Represents a Monobank source mapped to a Lunch Money manual account for normal imports.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| enabled | boolean | yes | Only enabled mappings are considered |
| monoAccountId | string | yes | Source account for statement fetch |
| monoDisplayName | string | yes | Safe setup display name |
| lunchMoneyAssetId | number | yes | Target Lunch Money manual account |
| lunchMoneyAccountName | string | yes | User-visible target name |
| tag | string | yes | Tag applied to eligible imported transactions |
| externalIdPrefix | string | yes | Existing deterministic id prefix |

### Validation Rules

- A mapping whose `monoAccountId` is also enabled as an ignored transfer source is not syncable.
- Eligible transactions for a syncable mapping keep existing mapping, tag, status, notes, and external id behavior.

## IgnoredTransferMatch

Runtime-only result that explains why a statement transaction was excluded.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| matched | boolean | yes | Whether the transaction should be excluded |
| reason | enum | yes | `counter-iban`, `masked-pan`, or `none` |
| sourceDisplayName | string | no | Sanitized display name only; not needed in logs by default |

### Validation Rules

- Matching must be deterministic for the same transaction and ignored source list.
- Ambiguous text-only matches must return `matched: false`.
- Match results are not persisted as transaction state.

## IgnoreConfigurationSummary

Safe output model for setup summary and config display.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| ignoredSourceCount | number | yes | Count of enabled ignored transfer sources |
| ignoredSources | array | yes | Sanitized ignored source summaries |
| syncableMappingCount | number | yes | Enabled mappings not suppressed by ignored source ids |
| skippedMappingCount | number | yes | Enabled mappings suppressed because they are also ignored |

### Validation Rules

- Must not include tokens, full PANs, full IBANs, or full Monobank account ids.
- Must make ignored transfer sources visually separate from Lunch Money import mappings.

## Relationships

- `IgnoredTransferSource` records live in app config separately from `ImportedAccountMapping`.
- Sync/backfill derive syncable mappings from enabled mappings minus enabled ignored source ids.
- Each fetched statement item for a syncable mapping is checked against enabled ignored sources.
- Matched ignored transfers are skipped before Lunch Money transaction mapping.
