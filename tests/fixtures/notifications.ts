import type {
  NotificationAdapter,
  NotificationDeliveryResult,
  NotificationEvent,
  NotificationMessage
} from "../../src/notifications/notification-types.js";

export function notificationEvent(overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    type: "sync-failure",
    sourceCommand: "sync",
    quiet: true,
    summary: "Sync failed",
    details: "Provider failed",
    logPath: "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\error.log",
    occurredAt: new Date("2026-05-16T20:00:00"),
    ...overrides
  };
}

export function memoryNotificationAdapter(
  result: NotificationDeliveryResult = { status: "delivered" }
): NotificationAdapter & { messages: NotificationMessage[] } {
  return {
    messages: [],
    isSupported: () => result.status !== "skipped",
    async notify(message: NotificationMessage) {
      this.messages.push(message);
      return result;
    }
  };
}

export function memoryNotificationLogger(): {
  successLines: string[];
  errorLines: string[];
  writer: {
    success(line: string): Promise<void>;
    error(line: string): Promise<void>;
  };
} {
  const successLines: string[] = [];
  const errorLines: string[] = [];
  return {
    successLines,
    errorLines,
    writer: {
      async success(line: string) {
        successLines.push(line);
      },
      async error(line: string) {
        errorLines.push(line);
      }
    }
  };
}
