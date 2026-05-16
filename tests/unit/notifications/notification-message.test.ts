import { describe, expect, it } from "vitest";
import { buildNotificationMessage } from "../../../src/notifications/notification-message.js";
import { notificationEvent } from "../../fixtures/notifications.js";

describe("notification message builder", () => {
  it("maps failure events to sanitized error messages", () => {
    const message = buildNotificationMessage(
      notificationEvent({
        summary: "failed with MONO_TOKEN=secret",
        details: "card 4444333322221111 failed"
      })
    );

    expect(message.severity).toBe("error");
    expect(message.title).toContain("sync failed");
    expect(message.body).not.toContain("secret");
    expect(message.body).not.toContain("4444333322221111");
    expect(message.body).toContain("4444...1111");
  });

  it("maps partial failure, lock-held, and success events", () => {
    expect(
      buildNotificationMessage(notificationEvent({ type: "sync-partial-failure" })).severity
    ).toBe("warning");
    expect(buildNotificationMessage(notificationEvent({ type: "lock-held" })).severity).toBe(
      "warning"
    );
    expect(buildNotificationMessage(notificationEvent({ type: "sync-success" })).severity).toBe(
      "info"
    );
  });
});
