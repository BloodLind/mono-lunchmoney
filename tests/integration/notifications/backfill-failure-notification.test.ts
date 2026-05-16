import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runBackfillCommand } from "../../../src/commands/backfill.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider } from "../../fixtures/providers.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("backfill failure notification", () => {
  it("notifies on backfill account failure", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-backfill-failure-notify-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig({ notifications: { enabled: true } })), "utf8");
    const adapter = memoryNotificationAdapter();

    await expect(
      runBackfillCommand(
        { config: configPath, from: "2026-05-01", to: "2026-05-02", quiet: true },
        {
          env: { APPDATA: root },
          statementClient: { async getStatement() { throw new Error("backfill failed"); } },
          budgetProvider: fakeBudgetProvider(),
          notificationAdapter: adapter,
          logWriter: memoryNotificationLogger().writer
        }
      )
    ).rejects.toThrow(/account failures/);

    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0].title).toContain("backfill completed with failures");
  });
});
