# Feature Specification: Secure Token Storage

**Feature Branch**: `004-secure-token-storage`
**Created**: 2026-05-16
**Status**: Draft
**Input**: User description: "We need provide proper token storage which will be protected from outer access and simple read to ensure that bank API keys cannot be used someone outside or read somehow. Setup flow should save tokens which can be reused by cli application any time"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save Tokens Securely During Setup (Priority: P1)

A user runs setup, receives clear guidance for obtaining required provider tokens, enters the tokens once, and chooses to save them in protected user-only storage so future CLI runs can reuse them without asking again.

**Why this priority**: The tool cannot safely support scheduled or repeated sync unless provider credentials are reusable without being stored in plain config files or command arguments.

**Independent Test**: Complete setup from a clean machine/user profile with no existing stored tokens, choose secure saving, then run config display and a non-interactive sync command. Verify setup succeeds, config display does not reveal token values, and sync can authenticate without prompting.

**Acceptance Scenarios**:

1. **Given** no saved provider tokens exist, **When** the user runs setup and enters valid Monobank and Lunch Money tokens, **Then** setup saves them in protected storage and finishes account mapping without writing tokens to config.
2. **Given** tokens were saved during setup, **When** the user later runs sync, backfill, or scheduler-triggered sync, **Then** the command retrieves credentials without prompting and without tokens appearing in command arguments.

---

### User Story 2 - Prevent Plain Reading Or Accidental Exposure (Priority: P1)

A privacy-conscious user can verify that bank and budget API tokens are not readable through ordinary config inspection, logs, scheduler details, or runtime files, and that another user profile cannot simply open project files to obtain usable credentials.

**Why this priority**: The tokens grant access to sensitive financial data. Preventing casual file reads, logs, and command-line disclosure is a core security requirement.

**Independent Test**: After saving tokens, inspect config, logs, scheduler command details, exported summaries, and runtime files available to the CLI. Verify no full token value appears and stored credentials are scoped to the current user context.

**Acceptance Scenarios**:

1. **Given** saved tokens exist, **When** the user runs config show, scheduler status, or reads app config/log files, **Then** full token values are absent.
2. **Given** saved tokens exist for one user profile, **When** a different user profile or unauthenticated process reads the app directory, **Then** it cannot recover usable provider token values from those files.

---

### User Story 3 - Manage Saved Tokens Safely (Priority: P2)

A user can see whether tokens are saved, replace them when rotating credentials, and remove them when uninstalling or revoking access, without manually editing hidden files or exposing token values.

**Why this priority**: Financial access tokens must be rotatable and removable. Users need a reliable way to recover from invalid, expired, or compromised tokens.

**Independent Test**: Save tokens, show credential status, replace one token, remove all saved tokens, and verify subsequent non-interactive commands fail with a clear credential setup message rather than prompting or leaking secrets.

**Acceptance Scenarios**:

1. **Given** tokens are saved, **When** the user checks token status, **Then** the CLI reports which provider credentials are present without showing values.
2. **Given** a provider token has changed, **When** the user replaces it through setup or credential management, **Then** future runs use the new token and the old token is no longer used.
3. **Given** the user removes saved tokens, **When** sync or backfill runs, **Then** the command exits clearly and instructs the user to run setup again.

---

### Edge Cases

- Protected storage is unavailable or denies access for the current user.
- Saved tokens exist but are invalid, revoked, expired, or fail provider validation.
- Only one of the two required provider tokens is saved.
- Existing environment variables are present from earlier versions.
- Setup is cancelled after one token is entered but before both providers are validated.
- A scheduled task runs under a different user context than the setup user.
- A user rotates or removes tokens while another sync is running.
- The user requests config display or scheduler status on a machine where tokens were never saved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Setup MUST guide users to obtain the required Monobank and Lunch Money tokens and accept token input without requiring command-line token arguments.
- **FR-002**: Setup MUST save valid provider tokens in protected storage scoped to the current user when the user chooses to save them.
- **FR-003**: The system MUST reuse saved provider tokens for setup reconfiguration, sync, backfill, and scheduled sync without prompting during non-setup commands.
- **FR-004**: The system MUST NOT save full provider token values in app config, logs, scheduler commands, command history instructions, or other ordinary runtime files.
- **FR-005**: The system MUST provide a token status view that reports whether each required provider token is saved without revealing token values.
- **FR-006**: Users MUST be able to replace saved provider tokens without manually editing files.
- **FR-007**: Users MUST be able to remove saved provider tokens so the CLI no longer has reusable access.
- **FR-008**: If saved tokens are missing, invalid, or inaccessible, non-setup commands MUST fail non-interactively with a clear action for restoring access.
- **FR-009**: If older environment-based tokens are present, setup MUST allow users to migrate or save them to protected storage without storing them in plain config.
- **FR-010**: The system MUST sanitize all token-related messages, errors, diagnostics, and notifications so full token values are never displayed.
- **FR-011**: The system MUST avoid falling back to plain persistent storage when protected storage is unavailable, unless the user explicitly chooses a temporary non-persistent setup-only use.
- **FR-012**: Saved credentials MUST be usable by the daily scheduled sync when it runs under the same user context that completed setup.

### Constitution-Aligned Requirements

- **CAR-001**: The feature MUST NOT introduce a local transaction database or imported transaction cursor as source of truth.
- **CAR-002**: Any imported transaction MUST preserve deterministic idempotency through Lunch Money `external_id`.
- **CAR-003**: Non-setup commands in scope MUST run without prompts.
- **CAR-004**: Tokens MUST NOT be stored in plain config, passed as arguments, printed, or logged.
- **CAR-005**: Sensitive account identifiers MUST be masked in console output, config display, and logs.
- **CAR-006**: Monobank statement windows, rate limits, and 500-item paging MUST be represented when statement fetching is in scope.
- **CAR-007**: Lunch Money imports MUST use manual assets, max 500-item batches, `status: "uncleared"`, configured tags, compact notes, and duplicate-safe insert options when transaction import is in scope.
- **CAR-008**: Scheduler behavior in scope MUST use Windows Task Scheduler and MUST NOT include API tokens in the registered command.

### Key Entities *(include if feature involves data)*

- **Provider Credential**: A saved secret for one provider, including provider name, presence state, validation state, and last checked time; the full token value is never exposed in displays.
- **Credential Status Summary**: A safe user-facing view showing whether required credentials are saved, missing, invalid, or inaccessible.
- **Credential Operation Result**: The outcome of saving, replacing, validating, or removing a credential, with sanitized messages for user action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful setup flows can save reusable provider credentials without writing full token values to config, logs, or scheduler command text.
- **SC-002**: 100% of sync, backfill, and scheduled sync runs can authenticate without user prompts when valid saved credentials exist for the current user.
- **SC-003**: Manual inspection of app config, logs, config display output, scheduler status, and task command text reveals zero full provider token values.
- **SC-004**: Users can check token presence, replace a token, or remove saved tokens in under 2 minutes using CLI guidance.
- **SC-005**: When protected credential access is unavailable, the CLI fails with a clear recovery message and stores zero token values in ordinary files.
- **SC-006**: If saved credentials are invalid, users receive a clear setup or replacement instruction within one failed run, without token leakage.

## Assumptions

- The tool remains a local Windows-friendly CLI without a hosted service.
- The primary secure persistence target is user-protected local credential storage; environment variables may remain supported as an input or compatibility source but are not the preferred persistent storage.
- Setup is allowed to be interactive; sync, backfill, and scheduled sync remain non-interactive.
- API tokens are sensitive financial credentials and must be treated as secrets even if provider scopes are limited.
- Static/semi-static config may be stored; imported transaction state may not.
