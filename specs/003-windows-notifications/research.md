# Research: Windows Notifications

## Notification Scope

**Decision**: Implement local operating-system notifications only, visible to
the current Windows user. Exclude email, push services, chat/webhook delivery,
hosted notification relays, and any permanent background listener.

**Rationale**: The feature request explicitly asks for notifications to be
spawned as notifications and states that only Windows is supported currently.
Keeping the scope local preserves the project boundary as a Windows-friendly
CLI without hosted services or new credentials.

**Alternatives considered**: Email or webhook alerts were rejected because they
require external services and secret handling beyond this feature. A tray app or
daemon was rejected because the product must remain a local scheduled CLI.

## Opt-In Defaults

**Decision**: Notifications are disabled by default. When enabled, failure,
partial-failure, and lock-held notifications are enabled by default; success
notifications require an explicit additional opt-in.

**Rationale**: Failure visibility is high value and low noise. Success
notifications can be noisy during daily scheduled operation, so they should be
controlled separately.

**Alternatives considered**: Enabling all notifications by default was rejected
because it would surprise existing users. A single all-or-nothing flag was
rejected because users may want failure alerts without success noise.

## Windows Delivery Approach

**Decision**: Add a notifier adapter with a Windows implementation that invokes
the operating system notification surface through a short-lived child process.
Use dependency injection for the process executor so tests never require real
Windows notification access.

**Rationale**: The current project already uses child-process boundaries for
Windows Task Scheduler. A short-lived spawned notification keeps the app
serverless, avoids a permanent process, and allows reliable mocked tests.

**Alternatives considered**: Adding a runtime notification package was rejected
for the first slice because it increases package and platform maintenance
surface. Logging only was rejected because the feature specifically asks for
notifications.

## Unsupported Platform Behavior

**Decision**: On non-Windows platforms, notification delivery is reported as
skipped and the triggering sync/backfill command continues with its original
exit outcome.

**Rationale**: Development and tests may run on non-Windows platforms. The user
requested Windows-only support, so non-Windows should not pretend to deliver
notifications or fail a financial sync solely because notifications are
unsupported.

**Alternatives considered**: Throwing a command failure on non-Windows was
rejected because it would make notification settings break otherwise valid
non-Windows development runs.

## Sanitization Boundary

**Decision**: Build notification messages from structured event summaries and
sanitize the final title/body before delivery and before logging delivery
failures.

**Rationale**: Notifications are visible outside the terminal and may appear on
the lock screen or in the notification center. They need at least the same
privacy protection as logs and config display.

**Alternatives considered**: Relying on callers to sanitize was rejected because
sync failures can include provider messages and account identifiers from
multiple paths.

## Failure Policy

**Decision**: Notification delivery failure is best-effort: record a sanitized
diagnostic in logs or troubleshooting output, but do not change the original
sync/backfill result.

**Rationale**: The financial import outcome must remain authoritative. A failed
toast should not turn a successful sync into a failed sync, and a failed toast
should not hide the original sync failure.

**Alternatives considered**: Propagating notification errors was rejected
because it would make operational diagnostics alter command semantics.
