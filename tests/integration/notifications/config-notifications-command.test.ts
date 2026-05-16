import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  runConfigNotificationsDisable,
  runConfigNotificationsEnable,
  runConfigNotificationsStatus
} from "../../../src/commands/config.command.js";
import { appConfig } from "../../fixtures/config.js";

describe("config notifications command", () => {
  it("enables, reports, and disables notifications while preserving mappings", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-config-notify-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");
    let output = "";
    const deps = { stdout: { write: (chunk: string) => void (output += chunk) } };

    await runConfigNotificationsEnable({ config: configPath, success: true }, deps);
    let saved = JSON.parse(readFileSync(configPath, "utf8")) as {
      notifications: { enabled: boolean; notifyOnSuccess: boolean };
      accounts: unknown[];
    };
    expect(saved.notifications).toMatchObject({ enabled: true, notifyOnSuccess: true });
    expect(saved.accounts).toHaveLength(1);

    runConfigNotificationsStatus({ config: configPath }, deps);
    expect(output).toContain("Notifications enabled: yes");

    await runConfigNotificationsDisable({ config: configPath }, deps);
    saved = JSON.parse(readFileSync(configPath, "utf8")) as {
      notifications: { enabled: boolean };
      accounts: unknown[];
    };
    expect(saved.notifications.enabled).toBe(false);
    expect(saved.accounts).toHaveLength(1);
  });
});
