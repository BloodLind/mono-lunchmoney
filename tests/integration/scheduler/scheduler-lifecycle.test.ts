import { describe, expect, it } from "vitest";
import {
  getScheduledTaskStatus,
  installScheduledTask,
  uninstallScheduledTask
} from "../../../src/scheduler/windows-task-scheduler.js";
import {
  SCHEDULER_FIXTURE_CONFIG_PATH,
  SCHEDULER_FIXTURE_LAUNCHER_PATH,
  expectNoSchedulerSecrets
} from "../../fixtures/scheduler.js";

describe("scheduler lifecycle with fake PowerShell executor", () => {
  it("installs, reports status, and uninstalls without real Task Scheduler access", async () => {
    const scripts: string[] = [];
    const launcherWrites: Array<{ filePath: string; content: string }> = [];
    const executor = async (script: string) => {
      scripts.push(script);
      if (script.includes("ConvertTo-Json")) {
        return JSON.stringify({
          TaskName: "MonoLunchMoneySync",
          NextRunTime: "2026-05-17 20:00:00",
          LastRunTime: "2026-05-16 20:00:00",
          LastTaskResult: 0,
          Execute: "wscript.exe",
          Arguments: `//B //Nologo "${SCHEDULER_FIXTURE_LAUNCHER_PATH}"`,
          RegisteredCommand: `mono-lunchmoney sync --config "${SCHEDULER_FIXTURE_CONFIG_PATH}" --quiet`,
          Mode: "hidden background"
        });
      }
      return "";
    };

    const command = await installScheduledTask({
      dailyAt: "20:00",
      taskName: "MonoLunchMoneySync",
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH,
      cliCommand: "mono-lunchmoney",
      wrapperScriptPath: SCHEDULER_FIXTURE_LAUNCHER_PATH,
      writeWrapperScript: async (filePath, content) => {
        launcherWrites.push({ filePath, content });
      },
      executor
    });
    const status = await getScheduledTaskStatus("MonoLunchMoneySync", executor);
    await uninstallScheduledTask("MonoLunchMoneySync", executor);

    expect(command.commandLine).toBe(
      `mono-lunchmoney sync --config "${SCHEDULER_FIXTURE_CONFIG_PATH}" --quiet`
    );
    expect(status).toMatchObject({ exists: true, lastResultCode: 0 });
    expect(status.registeredCommand).toBe(
      `mono-lunchmoney sync --config "${SCHEDULER_FIXTURE_CONFIG_PATH}" --quiet`
    );
    expect(status.mode).toBe("hidden background");
    expect(launcherWrites).toHaveLength(1);
    expect(scripts[0]).toContain("wscript.exe");
    expect(scripts[0]).not.toContain("Start-Process");
    expect(scripts[0]).not.toContain("powershell.exe");
    expectNoSchedulerSecrets(scripts.join("\n"));
    expectNoSchedulerSecrets(launcherWrites[0].content);
  });

  it("replaces a visible-console action with the hidden launcher action on reinstall", async () => {
    const scripts: string[] = [];

    await installScheduledTask({
      dailyAt: "20:00",
      taskName: "MonoLunchMoneySync",
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH,
      cliCommand: "mono-lunchmoney",
      wrapperScriptPath: SCHEDULER_FIXTURE_LAUNCHER_PATH,
      writeWrapperScript: async () => {},
      executor: async (script) => {
        scripts.push(script);
        return "";
      }
    });

    expect(scripts[0]).toContain("Register-ScheduledTask");
    expect(scripts[0]).toContain("-Force");
    expect(scripts[0]).toContain("wscript.exe");
    expect(scripts[0]).not.toContain("mono-lunchmoney sync --config");
  });
});
