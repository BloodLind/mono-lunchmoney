import { describe, expect, it } from "vitest";
import {
  getScheduledTaskStatus,
  installScheduledTask,
  uninstallScheduledTask
} from "../../../src/scheduler/windows-task-scheduler.js";

describe("Windows Task Scheduler wrapper with mocked executor", () => {
  it("builds install script and invokes executor with a fake executor", async () => {
    const scripts: string[] = [];

    const scheduled = await installScheduledTask({
      dailyAt: "20:00",
      taskName: "MonoLunchMoneySync",
      configPath: "C:\\config.json",
      executor: async (script) => {
        scripts.push(script);
        return "";
      }
    });

    expect(scheduled.commandLine).toContain("sync");
    expect(scripts[0]).toContain("Register-ScheduledTask");
    expect(scripts[0]).not.toMatch(/token/i);
  });

  it("parses status output from mocked executor", async () => {
    const status = await getScheduledTaskStatus("MonoLunchMoneySync", async () =>
      JSON.stringify({
        TaskName: "MonoLunchMoneySync",
        LastTaskResult: 0,
        Execute: "mono-lunchmoney",
        Arguments: 'sync --config "C:\\config.json" --quiet'
      })
    );

    expect(status.exists).toBe(true);
    expect(status.registeredCommand).toContain("sync");
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
