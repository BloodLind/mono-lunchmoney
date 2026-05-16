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

describe("Windows Task Scheduler wrapper with mocked executor", () => {
  it("builds a consoleless install script and invokes executor with a fake executor", async () => {
    const scripts: string[] = [];
    const launcherWrites: Array<{ filePath: string; content: string }> = [];

    const scheduled = await installScheduledTask({
      dailyAt: "20:00",
      taskName: "MonoLunchMoneySync",
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH,
      nodeExecutable: "C:\\Program Files\\nodejs\\node.exe",
      cliScriptPath: "D:\\apps\\mono-lunchmoney\\dist\\cli.js",
      wrapperScriptPath: SCHEDULER_FIXTURE_LAUNCHER_PATH,
      writeWrapperScript: async (filePath, content) => {
        launcherWrites.push({ filePath, content });
      },
      executor: async (script) => {
        scripts.push(script);
        return "";
      }
    });

    expect(scheduled.commandLine).toContain("sync");
    expect(scheduled.execute).toBe("C:\\Program Files\\nodejs\\node.exe");
    expect(scheduled.arguments[0]).toBe("D:\\apps\\mono-lunchmoney\\dist\\cli.js");
    expect(launcherWrites).toHaveLength(1);
    expect(launcherWrites[0].filePath).toBe(SCHEDULER_FIXTURE_LAUNCHER_PATH);
    expect(launcherWrites[0].content).toContain("shell.Run(command, 0, True)");
    expect(scripts[0]).toContain("Register-ScheduledTask");
    expect(scripts[0]).toContain("wscript.exe");
    expect(scripts[0]).toContain("//B");
    expect(scripts[0]).toContain("//Nologo");
    expect(scripts[0]).toContain("MonoLunchMoneySync.vbs");
    expect(scripts[0]).not.toContain("powershell.exe");
    expect(scripts[0]).not.toContain("Start-Process");
    expect(scripts[0]).not.toContain("node.exe");
    expect(scripts[0]).not.toContain("dist\\cli.js");
    expectNoSchedulerSecrets(scripts[0]);
    expectNoSchedulerSecrets(launcherWrites[0].content);
  });

  it("parses status output from mocked executor", async () => {
    const status = await getScheduledTaskStatus("MonoLunchMoneySync", async () =>
      JSON.stringify({
        TaskName: "MonoLunchMoneySync",
        LastTaskResult: 0,
        Execute: "wscript.exe",
        Arguments: `//B //Nologo "${SCHEDULER_FIXTURE_LAUNCHER_PATH}"`,
        RegisteredCommand: `mono-lunchmoney sync --config "${SCHEDULER_FIXTURE_CONFIG_PATH}" --quiet`,
        Mode: "hidden background"
      })
    );

    expect(status.exists).toBe(true);
    expect(status.registeredCommand).toContain("sync");
    expect(status.registeredCommand).toBe(
      `mono-lunchmoney sync --config "${SCHEDULER_FIXTURE_CONFIG_PATH}" --quiet`
    );
    expect(status.mode).toBe("hidden background");
  });

  it("invokes uninstall script through mocked executor", async () => {
    const scripts: string[] = [];

    await uninstallScheduledTask("MonoLunchMoneySync", async (script) => {
      scripts.push(script);
      return "";
    });

    expect(scripts[0]).toContain("Unregister-ScheduledTask");
  });
});
