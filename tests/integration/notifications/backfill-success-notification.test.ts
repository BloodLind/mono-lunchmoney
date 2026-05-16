import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runBackfillCommand } from "../../../src/commands/backfill.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("backfill success notification", () => {
  it("notifies on successful backfill when success preference is enabled", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-backfill-success-notify-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify(appConfig({ notifications: { enabled: true, notifyOnSuccess: true } })),
      "utf8"
    );
    const adapter = memoryNotificationAdapter();

    await runBackfillCommand(
      { config: configPath, from: "2026-05-01", to: "2026-05-02", quiet: true },
      {
        env: { APPDATA: root },
        statementClient: fakeStatementClient([[monoStatementItem()]]),
        budgetProvider: fakeBudgetProvider(),
        notificationAdapter: adapter,
        logWriter: memoryNotificationLogger().writer
      }
    );

    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0].title).toContain("backfill completed");
  });
});
