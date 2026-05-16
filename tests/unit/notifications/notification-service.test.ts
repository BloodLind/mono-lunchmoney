import { describe, expect, it } from "vitest";
import { handleNotificationEvent } from "../../../src/notifications/notification-service.js";
import {
  memoryNotificationAdapter,
  memoryNotificationLogger,
  notificationEvent
} from "../../fixtures/notifications.js";

describe("notification service", () => {
  it("does nothing when notifications are disabled", async () => {
    const adapter = memoryNotificationAdapter();
    const logger = memoryNotificationLogger();

    const result = await handleNotificationEvent({
      config: { enabled: false },
      event: notificationEvent(),
      adapter,
      logger: logger.writer
    });

    expect(result).toBeUndefined();
    expect(adapter.messages).toHaveLength(0);
  });

  it("filters events by preferences", async () => {
    const adapter = memoryNotificationAdapter();
    const logger = memoryNotificationLogger();

    const result = await handleNotificationEvent({
      config: { enabled: true, notifyOnSuccess: false },
      event: notificationEvent({ type: "sync-success" }),
      adapter,
      logger: logger.writer
    });

    expect(result).toBeUndefined();
    expect(adapter.messages).toHaveLength(0);
  });

  it("logs skipped and failed delivery diagnostics", async () => {
    const skipped = memoryNotificationAdapter({
      status: "skipped",
      reason: "unsupported-platform"
    });
    const failed = memoryNotificationAdapter({
      status: "failed",
      reason: "failed with LUNCHMONEY_TOKEN=secret"
    });
    const logger = memoryNotificationLogger();

    await handleNotificationEvent({
      config: { enabled: true },
      event: notificationEvent(),
      adapter: skipped,
      logger: logger.writer
    });
    await handleNotificationEvent({
      config: { enabled: true },
      event: notificationEvent(),
      adapter: failed,
      logger: logger.writer
    });

    const output = logger.errorLines.join("\n");
    expect(output).toContain("Notification skipped");
    expect(output).toContain("Notification failed");
    expect(output).not.toContain("secret");
  });
});
