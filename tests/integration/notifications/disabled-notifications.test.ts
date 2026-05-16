import { describe, expect, it } from "vitest";
import { handleNotificationEvent } from "../../../src/notifications/notification-service.js";
import {
  memoryNotificationAdapter,
  memoryNotificationLogger,
  notificationEvent
} from "../../fixtures/notifications.js";

describe("disabled notifications", () => {
  it("requests no delivery for notification-worthy events", async () => {
    const adapter = memoryNotificationAdapter();
    const logger = memoryNotificationLogger();

    await handleNotificationEvent({
      config: { enabled: false },
      event: notificationEvent({ type: "sync-failure" }),
      adapter,
      logger: logger.writer
    });

    expect(adapter.messages).toHaveLength(0);
    expect(logger.errorLines).toHaveLength(0);
  });
});
