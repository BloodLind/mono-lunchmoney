import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CliError, EXIT_CODES } from "../../../src/cli/command-registry.js";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient } from "../../fixtures/providers.js";
import { memoryNotificationAdapter, memoryNotificationLogger } from "../../fixtures/notifications.js";

describe("sync lock-held notification", () => {
  it("notifies and preserves lock exit code", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-sync-lock-notify-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig({ notifications: { enabled: true } })), "utf8");
    mkdirSync(path.join(root, "mono-lunchmoney"), { recursive: true });
    writeFileSync(
      path.join(root, "mono-lunchmoney", "sync.lock"),
      JSON.stringify({ pid: process.pid, createdAt: new Date(), command: "sync" }),
      "utf8"
    );
    const adapter = memoryNotificationAdapter();

    await expect(
      runSyncCommand(
        { config: configPath, quiet: true },
        {
          env: { APPDATA: root },
          statementClient: fakeStatementClient([[]]),
          budgetProvider: fakeBudgetProvider(),
          notificationAdapter: adapter,
          logWriter: memoryNotificationLogger().writer
        }
      )
    ).rejects.toMatchObject({ exitCode: EXIT_CODES.LOCKED } satisfies Partial<CliError>);

    expect(adapter.messages[0].title).toContain("already running");
  });
});
