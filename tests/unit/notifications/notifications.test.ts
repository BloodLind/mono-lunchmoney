import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAppConfig } from "../../../src/config/config.model.js";
import { writeConfig } from "../../../src/config/config.writer.js";
import {
  enableNotifications,
  getNotificationConfig,
  shouldNotify
} from "../../../src/notifications/notification-config.js";
import { buildNotificationMessage } from "../../../src/notifications/notification-message.js";
import { handleNotificationEvent } from "../../../src/notifications/notification-service.js";
import { appConfig } from "../../fixtures/config.js";
import {
  memoryNotificationAdapter,
  memoryNotificationLogger,
  notificationEvent
} from "../../fixtures/notifications.js";

describe("notification config", () => {
  it("defaults notifications to disabled", () => {
    const config = parseAppConfig(appConfig({ notifications: undefined }));

    expect(getNotificationConfig(config.notifications)).toEqual({
      enabled: false,
      notifyOnStart: true,
      notifyOnSuccess: false,
      notifyOnFailure: true,
      notifyOnPartialFailure: true,
      notifyOnLockHeld: true
    });
  });

  it("defaults enabled notifications to failure-oriented preferences", () => {
    const config = parseAppConfig(appConfig({ notifications: { enabled: true } }));

    expect(config.notifications).toEqual({
      enabled: true,
      notifyOnStart: true,
      notifyOnSuccess: false,
      notifyOnFailure: true,
      notifyOnPartialFailure: true,
      notifyOnLockHeld: true
    });
  });

  it("enables start notifications by default but not for failure-only mode", () => {
    expect(enableNotifications()).toMatchObject({
      enabled: true,
      notifyOnStart: true
    });
    expect(enableNotifications({ failureOnly: true })).toMatchObject({
      enabled: true,
      notifyOnStart: false
    });
    expect(shouldNotify({ enabled: true }, "sync-started")).toBe(true);
    expect(shouldNotify({ enabled: true, notifyOnStart: false }, "sync-started")).toBe(false);
  });

  it("writes token-free notification config", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-notify-config-"));
    const configPath = path.join(root, "config.json");

    await writeConfig(configPath, {
      ...appConfig({
        notifications: {
          enabled: true,
          notifyOnStart: true,
          notifyOnSuccess: true,
          notifyOnFailure: true,
          notifyOnPartialFailure: true,
          notifyOnLockHeld: true
        }
      }),
      MONO_TOKEN: "secret"
    });

    const written = readFileSync(configPath, "utf8");
    expect(written).toContain('"notifications"');
    expect(written).not.toContain("secret");
    expect(written).not.toMatch(/token/i);
  });
});

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
