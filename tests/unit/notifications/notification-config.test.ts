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
import { appConfig } from "../../fixtures/config.js";

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

    await writeConfig(
      configPath,
      {
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
      }
    );

    const written = readFileSync(configPath, "utf8");
    expect(written).toContain('"notifications"');
    expect(written).not.toContain("secret");
    expect(written).not.toMatch(/token/i);
  });
});
