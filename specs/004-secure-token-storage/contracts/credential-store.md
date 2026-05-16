# Internal Contract: Credential Store

## Purpose

Provide a single boundary for saving, reading, replacing, removing, and checking provider credentials without exposing token values to command code, logs, or config display.

## Providers

```text
monobank
lunchmoney
```

## Operations

### Save Credential

Input:

```text
provider
secret
```

Expected result:

- Secret is saved in protected user-scoped storage.
- Existing credential for the provider is replaced atomically where possible.
- Full secret is never returned in the operation result.

### Read Credential

Input:

```text
provider
```

Expected result:

- Returns full secret only to the token resolver/runtime caller.
- Returns a typed inaccessible/missing failure when storage cannot provide the secret.
- Does not log or print the secret.

### Remove Credential

Input:

```text
provider
```

Expected result:

- Saved credential is removed if present.
- Missing credential removal is treated as successful no-op for cleanup workflows.

### Get Status

Input:

```text
provider or all providers
```

Expected result:

- Returns safe presence/source/health information.
- Never returns full or partial token values.

## Failure Policy

- Protected storage unavailable: fail closed; do not persist token in plain files.
- Corrupted or unreadable record: mark provider inaccessible and direct user to replace credentials.
- Invalid provider token: mark invalid after validation and direct user to replace credentials.
- Unexpected storage error: return sanitized message and non-zero CLI outcome.

## Security Requirements

- Stored records must not be useful if copied from the app data directory by another user.
- Secrets must be scoped to the current user context.
- Plain config, logs, scheduler commands, and notification text must remain token-free.
