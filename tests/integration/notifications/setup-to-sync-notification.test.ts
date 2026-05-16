import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup to sync notification flow", () => {
  it("uses setup notification settings for a later quiet sync failure", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-sync-notify-"));
    const configPath = path.join(root, "config.json");
    const answers = ["no", "", "", "yes", "no", "yes", "1", ""];

    await runSetupCommand(
      { config: configPath },
      {
        env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        stdout: { write: () => true }
      }
    );

    expect(readFileSync(configPath, "utf8")).toContain('"enabled": true');

    const adapter = memoryNotificationAdapter();
    await expect(
      runSyncCommand(
        { config: configPath, quiet: true },
        {
          env: { APPDATA: root },
          statementClient: {
            async getStatement() {
              throw new Error("MONO_TOKEN=secret failed for 4444333322221111");
            }
          },
          budgetProvider: fakeBudgetProvider(),
          notificationAdapter: adapter,
          logWriter: memoryNotificationLogger().writer
        }
      )
    ).rejects.toThrow(/account failures/);

    expect(adapter.messages).toHaveLength(2);
    expect(adapter.messages[0].title).toContain("Sync started");
    expect(adapter.messages[1].title).toContain("completed with failures");
    expect(adapter.messages[1].body).not.toContain("secret");
    expect(adapter.messages[1].body).toContain("4444...1111");
  });
});
