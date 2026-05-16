import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import type { SchedulerOptions } from "../../../src/scheduler/windows-task-scheduler.js";
import { memoryCredentialStore, SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup scheduler install", () => {
  it("creates the Windows scheduled task when selected during setup", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-scheduler-"));
    const configPath = path.join(root, "config.json");
    const installed: SchedulerOptions[] = [];
    const answers = ["", "", "no", "yes", "1", "", "no", "yes", "21:30"];
    let stdout = "";

    await runSetupCommand(
      { config: configPath },
      {
        env: { APPDATA: root },
        credentialStore: memoryCredentialStore({
          monobank: SAMPLE_MONO_TOKEN,
          lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
        }),
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        installSchedulerTask: async (options) => {
          installed.push(options);
          return {
            execute: "mono-lunchmoney",
            arguments: ["sync", "--config", options.configPath, "--quiet"],
            commandLine: `mono-lunchmoney sync --config "${options.configPath}" --quiet`
          };
        },
        stdout: { write: (chunk) => void (stdout += chunk) }
      }
    );

    expect(installed).toEqual([
      expect.objectContaining({
        dailyAt: "21:30",
        taskName: "MonoLunchMoneySync",
        configPath,
        appDataDirectory: path.join(root, "mono-lunchmoney")
      })
    ]);
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      scheduler?: { enabled: boolean; dailyAt: string; taskName: string };
    };
    expect(config.scheduler).toMatchObject({
      enabled: true,
      dailyAt: "21:30",
      taskName: "MonoLunchMoneySync"
    });
    const plain = stripAnsi(stdout);
    expect(plain).toContain("Scheduler:");
    expect(plain).toContain("21:30");
    expect(plain).toContain("Scheduled command:");
    expect(plain).toContain(`mono-lunchmoney sync --config "${configPath}" --quiet`);
  });
});
