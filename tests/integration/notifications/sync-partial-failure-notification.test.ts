import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { accountMapping, appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, monoStatementItem } from "../../fixtures/providers.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("sync partial failure notification", () => {
  it("notifies when one account fails and another can continue", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-sync-partial-notify-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify(
        appConfig({
          notifications: { enabled: true },
          accounts: [
            accountMapping({ monoAccountId: "bad", lunchMoneyAccountName: "Bad" }),
            accountMapping({ monoAccountId: "good", lunchMoneyAccountName: "Good" })
          ]
        })
      ),
      "utf8"
    );
    let call = 0;
    const adapter = memoryNotificationAdapter();

    await expect(
      runSyncCommand(
        { config: configPath, quiet: true },
        {
          env: { APPDATA: root },
          statementClient: {
            async getStatement() {
              call += 1;
              if (call === 1) throw new Error("Bad failed");
              return [monoStatementItem({ id: "good" })];
            }
          },
          budgetProvider: fakeBudgetProvider(),
          notificationAdapter: adapter,
          logWriter: memoryNotificationLogger().writer
        }
      )
    ).rejects.toThrow(/account failures/);

    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0].title).toContain("completed with failures");
    expect(adapter.messages[0].body).toContain("Bad failed");
  });
});
