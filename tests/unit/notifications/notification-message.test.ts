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
    expect(message.title).toContain("Sync failed");
    expect(message.body).toContain("Sync failed before it could finish.");
    expect(message.body).not.toContain("secret");
    expect(message.body).not.toContain("4444333322221111");
    expect(message.body).toContain("4444...1111");
    expect(message.body).not.toContain("Logs:");
    expect(message.body).not.toContain("error.log");
  });

  it("maps started, partial failure, lock-held, and success events", () => {
    const started = buildNotificationMessage(notificationEvent({ type: "sync-started" }));
    const partial = buildNotificationMessage(notificationEvent({ type: "sync-partial-failure" }));
    const locked = buildNotificationMessage(notificationEvent({ type: "lock-held" }));
    const success = buildNotificationMessage(notificationEvent({ type: "sync-success" }));

    expect(started.severity).toBe("info");
    expect(started.title).toContain("Sync started");
    expect(started.body).toContain("Sync started.");
    expect(partial.severity).toBe("warning");
    expect(partial.body).toContain("Sync finished, but one or more accounts failed.");
    expect(locked.severity).toBe("warning");
    expect(locked.body).toContain("another run is already active");
    expect(success.severity).toBe("info");
    expect(success.body).toContain("Sync finished successfully.");
  });
});
