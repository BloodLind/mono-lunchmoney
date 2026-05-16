# Research: Secure Token Storage

## Decision: Store reusable tokens in user-scoped protected credential records

**Rationale**: The feature requires tokens to be reusable by the CLI and scheduled sync while not being readable from config, logs, or ordinary runtime files. User-scoped protected storage satisfies the main user risk: someone reading app files or command output should not recover bank API keys. It also aligns with the existing Windows-local CLI boundary and scheduled task behavior when setup and scheduler run as the same user.

**Alternatives considered**:

- **Plain environment variables as persistent storage**: Simple but values can be inspected more easily and were explicitly called out as insufficient for protected storage.
- **Plain encrypted file with app-managed key**: Avoids direct token text in files but only moves the secret to another local key that also needs protection.
- **Windows Credential Manager only**: Strong user-facing concept, but reliable read/write access from Node without a native dependency or external module is not guaranteed in the current project constraints.
- **Native keychain dependency**: Good abstraction, but adds a native runtime dependency and installation risk for a small Windows-first CLI.

## Decision: Keep environment variables as compatibility input, not preferred persistence

**Rationale**: Existing users may already have `MONO_TOKEN` and `LUNCHMONEY_TOKEN`. Setup should be able to read those values, validate them, and save them into protected storage. Non-interactive commands can use environment values only when protected credentials are missing, preserving backward compatibility while guiding users to migrate.

**Alternatives considered**:

- **Remove environment support immediately**: Stronger security posture but breaks existing users and tests unnecessarily.
- **Prefer environment over protected storage**: Maintains old behavior but undermines the purpose of the feature.

## Decision: Add explicit credential management commands

**Rationale**: Users need a safe way to inspect presence, replace, and remove saved tokens without editing files. A dedicated command group keeps this separate from account mappings and config display, while status output can show only provider presence and health.

**Alternatives considered**:

- **Hide management inside setup only**: Works for first-time setup but makes token rotation and removal awkward.
- **Put token status in config show only**: Convenient but risks mixing secret lifecycle operations into a general config display command.

## Decision: Fail closed when protected storage is unavailable

**Rationale**: The user explicitly asked for storage protected from simple reads and outside access. If protected storage cannot save or read tokens, the CLI should not silently write tokens to ordinary files. Setup may allow temporary setup-only token use, but future non-interactive commands must fail clearly until credentials are saved or environment compatibility values are present.

**Alternatives considered**:

- **Fallback to plaintext config**: Violates the core requirement.
- **Fallback to obfuscated config**: Gives a false sense of security and remains readable with little effort.

## Decision: Keep credential failures sanitized and actionable

**Rationale**: Credential errors often include context strings that can accidentally include secret material. All credential operation failures should pass through existing sanitization and present recovery actions such as rerun setup, replace credentials, or check user context.

**Alternatives considered**:

- **Expose raw storage errors**: Easier to debug, but increases leak risk.
- **Generic failure only**: Safer but not actionable enough for users managing scheduled sync.
