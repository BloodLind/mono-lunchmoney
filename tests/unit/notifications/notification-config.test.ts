import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAppConfig } from "../../../src/config/config.model.js";
import { writeConfig } from "../../../src/config/config.writer.js";
import { getNotificationConfig } from "../../../src/notifications/notification-config.js";
import { appConfig } from "../../fixtures/config.js";

describe("notification config", () => {
  it("defaults notifications to disabled", () => {
    const config = parseAppConfig(appConfig({ notifications: undefined }));

    expect(getNotificationConfig(config.notifications)).toEqual({
      enabled: false,
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
      notifyOnSuccess: false,
      notifyOnFailure: true,
      notifyOnPartialFailure: true,
      notifyOnLockHeld: true
    });
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
