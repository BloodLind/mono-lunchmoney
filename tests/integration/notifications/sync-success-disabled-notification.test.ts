import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("failure-only success notification behavior", () => {
  it("still notifies when sync starts but does not notify on success when success preference is disabled", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-sync-success-disabled-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig({ notifications: { enabled: true } })), "utf8");
    const adapter = memoryNotificationAdapter();

    await runSyncCommand(
      { config: configPath, quiet: true },
      {
        env: { APPDATA: root },
        statementClient: fakeStatementClient([[monoStatementItem()]]),
        budgetProvider: fakeBudgetProvider(),
        notificationAdapter: adapter,
        logWriter: memoryNotificationLogger().writer
      }
    );

    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0].title).toContain("Sync started");
  });
});
