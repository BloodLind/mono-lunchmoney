# CLI Contract: Windows Notifications

## Global Rules

- Notification settings are stored in config and never as command-line secrets.
- Existing scheduled commands remain token-free and keep the form
  `mono-lunchmoney sync --config "<configPath>" --quiet`.
- `sync`, `backfill`, `scheduler status`, `scheduler uninstall`, `config show`,
  and notification config commands remain non-interactive.
- Notification failures never override the original command exit code.
- Notification text must be sanitized before display.

## `mono-lunchmoney setup`

**Interactive**: yes.

**New behavior**:

1. Ask whether Windows notifications should be enabled.
2. If enabled, ask whether successful sync completion should notify.
3. Save notification settings in config.
4. Print notification settings in the sanitized setup summary.

**Rules**:

- Notifications default to disabled when the user accepts defaults.
- No notification permission prompt may be required during setup beyond CLI
  preference questions.
- Setup must not test real notification delivery unless explicitly added as a
  separate future option.

## `mono-lunchmoney config show`

**Interactive**: no.

**New output**:

- Show whether notifications are enabled.
- Show whether success, failure, partial failure, and lock-held events are
  configured to notify.
- Continue to omit tokens and sensitive financial identifiers.

## `mono-lunchmoney config notifications enable`

**Interactive**: no.

**Inputs**:

- Optional `--config <path>`.
- Optional `--success` to enable success notifications.
- Optional `--failure-only` to keep success notifications disabled.

**Behavior**:

- Load existing config.
- Set notifications enabled.
- Preserve existing sync/account mappings.
- Save token-free config.
- Print sanitized settings summary.

## `mono-lunchmoney config notifications disable`

**Interactive**: no.

**Inputs**:

- Optional `--config <path>`.

**Behavior**:

- Load existing config.
- Set notifications disabled.
- Preserve existing sync/account mappings.
- Save token-free config.
- Print sanitized settings summary.

## `mono-lunchmoney config notifications status`

**Interactive**: no.

**Inputs**:

- Optional `--config <path>`.

**Output**:

- Notifications enabled: yes/no.
- Notify on success: yes/no.
- Notify on failure: yes/no.
- Notify on partial failure: yes/no.
- Notify on lock held: yes/no.

## `mono-lunchmoney sync`

**Interactive**: no.

**Notification behavior**:

- If notifications are disabled, request no notification.
- If notifications are enabled and sync succeeds, notify only when success
  notifications are enabled.
- If notifications are enabled and sync fails, notify when failure notifications
  are enabled.
- If notifications are enabled and sync completes with partial account failures,
  notify when partial-failure notifications are enabled.
- If sync exits because the lock is already held, notify when lock-held
  notifications are enabled.

## `mono-lunchmoney backfill`

**Interactive**: no.

**Notification behavior**:

- Use the same delivery and failure policy as sync.
- Success notifications follow the same success opt-in.
- Backfill notification messages must identify the outcome as backfill rather
  than daily sync.
