import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("notification delivery failure policy", () => {
  it("does not change successful sync outcome", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-notify-fail-policy-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify(
        appConfig({ notifications: { enabled: true, notifyOnSuccess: true } })
      ),
      "utf8"
    );
    const logger = memoryNotificationLogger();

    await expect(
      runSyncCommand(
        { config: configPath, quiet: true },
        {
          env: { APPDATA: root },
          statementClient: fakeStatementClient([[monoStatementItem()]]),
          budgetProvider: fakeBudgetProvider(),
          notificationAdapter: memoryNotificationAdapter({
            status: "failed",
            reason: "toast failed"
          }),
          logWriter: logger.writer
        }
      )
    ).resolves.toBeUndefined();

    expect(logger.errorLines.join("\n")).toContain("Notification failed");
  });
});
