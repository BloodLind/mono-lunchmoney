# Notification Adapter Contract

## Types

```ts
export type NotificationSeverity = "info" | "warning" | "error";

export type NotificationMessage = {
  title: string;
  body: string;
  severity: NotificationSeverity;
};

export type NotificationDeliveryResult = {
  status: "delivered" | "skipped" | "failed";
  reason?: string;
};

export interface NotificationAdapter {
  isSupported(): boolean;
  notify(message: NotificationMessage): Promise<NotificationDeliveryResult>;
}
```

## Message Rules

- `title` and `body` must be sanitized before reaching the adapter.
- `title` should identify the product and outcome, for example
  `Mono Lunch Money sync failed`.
- `body` should be concise and point to logs or config inspection when useful.
- Messages must not include tokens, full PANs, full IBANs, full account numbers,
  full transaction ids, or unsanitized long account identifiers.

## Delivery Rules

- Windows implementation returns `delivered` when it successfully requests a
  local notification.
- Non-Windows implementation returns `skipped` with reason
  `unsupported-platform`.
- Delivery errors return `failed` with a sanitized reason.
- The adapter must not throw for expected unsupported-platform or delivery
  failure outcomes; unexpected exceptions are caught by the notification
  service and converted to `failed`.

## Notification Service Rules

```ts
export async function handleNotificationEvent(input: {
  config: NotificationConfig | undefined;
  event: NotificationEvent;
  adapter: NotificationAdapter;
  logger: LogWriter;
}): Promise<NotificationDeliveryResult | undefined>;
```

- Return `undefined` when notifications are disabled or the event is not enabled
  by preferences.
- Sanitize the message before adapter delivery.
- Log `skipped` and `failed` results as sanitized diagnostics.
- Never mutate sync/backfill result objects.
- Never change the caller's intended exit code.
