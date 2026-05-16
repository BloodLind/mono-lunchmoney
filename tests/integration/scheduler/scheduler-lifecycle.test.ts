import { describe, expect, it } from "vitest";
import {
  getScheduledTaskStatus,
  installScheduledTask,
  uninstallScheduledTask
} from "../../../src/scheduler/windows-task-scheduler.js";

describe("scheduler lifecycle with fake PowerShell executor", () => {
  it("installs, reports status, and uninstalls without real Task Scheduler access", async () => {
    const scripts: string[] = [];
    const executor = async (script: string) => {
      scripts.push(script);
      if (script.includes("ConvertTo-Json")) {
        return JSON.stringify({
          TaskName: "MonoLunchMoneySync",
          NextRunTime: "2026-05-17 20:00:00",
          LastRunTime: "2026-05-16 20:00:00",
          LastTaskResult: 0,
          Execute: "mono-lunchmoney",
          Arguments: 'sync --config "C:\\config.json" --quiet'
        });
      }
      return "";
    };

    const command = await installScheduledTask({
      dailyAt: "20:00",
      taskName: "MonoLunchMoneySync",
      configPath: "C:\\config.json",
      executor
    });
    const status = await getScheduledTaskStatus("MonoLunchMoneySync", executor);
    await uninstallScheduledTask("MonoLunchMoneySync", executor);

    expect(command.commandLine).toBe('mono-lunchmoney sync --config "C:\\config.json" --quiet');
    expect(status).toMatchObject({ exists: true, lastResultCode: 0 });
    expect(scripts.join("\n")).not.toMatch(/MONO_TOKEN|LUNCHMONEY_TOKEN/);
  });
});
