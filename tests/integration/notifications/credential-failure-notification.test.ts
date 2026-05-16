import { describe, expect, it } from "vitest";
import { buildNotificationMessage } from "../../../src/notifications/notification-message.js";
import { SAMPLE_LUNCHMONEY_TOKEN } from "../../fixtures/credentials.js";

describe("credential failure notifications", () => {
  it("does not expose full provider token values", () => {
    const message = buildNotificationMessage({
      type: "sync-failure",
      sourceCommand: "sync",
      quiet: true,
      summary: "Sync failed.",
      details: `Lunch Money credential failed: ${SAMPLE_LUNCHMONEY_TOKEN}`,
      logPath: "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\error.log",
      occurredAt: new Date("2026-05-16T12:00:00")
    });

    expect(message.body).not.toContain(SAMPLE_LUNCHMONEY_TOKEN);
    expect(message.body).toContain("lunch-...4321");
  });
});
