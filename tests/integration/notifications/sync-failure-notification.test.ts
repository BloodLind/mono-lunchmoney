import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { appConfig } from "../../fixtures/config.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("sync failure notification", () => {
  it("notifies on quiet sync failure", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-sync-failure-notify-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify(appConfig({ accounts: [], notifications: { enabled: true } })),
      "utf8"
    );
    const adapter = memoryNotificationAdapter();

    await expect(
      runSyncCommand(
        { config: configPath, quiet: true },
        {
          env: { APPDATA: root },
          notificationAdapter: adapter,
          logWriter: memoryNotificationLogger().writer
        }
      )
    ).rejects.toThrow(/enabled account/);

    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0].title).toContain("Sync failed");
    expect(adapter.messages[0].body).not.toContain("Logs:");
  });
});
