# Data Model: Secure Token Storage

## ProviderCredential

Represents a credential for one external provider.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| provider | enum | yes | `monobank` or `lunchmoney` |
| displayName | string | yes | Safe label for CLI output |
| secret | string | write/read only | Full token value; never displayed, logged, or stored in config |
| savedAt | datetime | no | Used for status and rotation visibility when available |
| lastValidatedAt | datetime | no | Updated after successful provider validation when available |
| status | enum | yes | `missing`, `saved`, `invalid`, `inaccessible`, `unknown` |

### Validation Rules

- Provider must be one of the supported providers.
- Secret must be non-empty before save.
- Full secret value must never appear in status, config display, logs, scheduler output, or notifications.
- Saved credential must be scoped to the current user context.

## CredentialStatusSummary

Safe display object for credential state.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| provider | enum | yes | Provider represented by the status |
| present | boolean | yes | Whether a reusable credential is available |
| source | enum | yes | `protected-storage`, `environment`, `missing`, `inaccessible` |
| health | enum | yes | `ready`, `needs-setup`, `invalid`, `inaccessible`, `unknown` |
| message | string | yes | Sanitized user-facing status |

### Validation Rules

- Must not include full token values or reversible fragments.
- May indicate environment compatibility source but should recommend protected storage when applicable.

## CredentialOperationResult

Outcome of a save, replace, remove, read, or status operation.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| operation | enum | yes | `save`, `replace`, `remove`, `read`, `status`, `validate` |
| provider | enum | no | Omitted for all-provider operations |
| success | boolean | yes | Whether the requested operation completed |
| message | string | yes | Sanitized user-facing message |
| recoverable | boolean | yes | Whether the user can fix the issue through setup or credential commands |

## ProviderTokenSet

Runtime-only object passed to provider clients.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| monoToken | string | yes | Resolved from protected storage or compatibility source |
| lunchMoneyToken | string | yes | Resolved from protected storage or compatibility source |

### Lifecycle

```text
missing -> entered during setup -> validated -> saved -> reused
saved -> replaced -> validated -> saved
saved -> removed -> missing
saved -> invalid -> replaced or removed
saved -> inaccessible -> user action required
```

## Relationships

- `ProviderTokenSet` is assembled from two `ProviderCredential` records.
- `CredentialStatusSummary` is derived from credential availability without exposing `secret`.
- `CredentialOperationResult` reports lifecycle transitions to setup and credential commands.
