import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider } from "../../fixtures/providers.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("notification sanitization", () => {
  it("sanitizes token-like and account-like values before delivery", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-notify-sanitize-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig({ notifications: { enabled: true } })), "utf8");
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
    ).rejects.toThrow();

    const output = adapter.messages.map((message) => `${message.title}\n${message.body}`).join("\n");
    expect(output).not.toContain("secret");
    expect(output).not.toContain("4444333322221111");
    expect(output).toContain("4444...1111");
  });
});
