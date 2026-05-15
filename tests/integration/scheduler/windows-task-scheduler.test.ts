import { describe, expect, it } from "vitest";
import {
  getScheduledTaskStatus,
  installScheduledTask,
  uninstallScheduledTask
} from "../../../src/scheduler/windows-task-scheduler.js";

describe("Windows Task Scheduler wrapper with mocked executor", () => {
  it("builds install script and invokes executor on Windows", async () => {
    const scripts: string[] = [];

    if (process.platform === "win32") {
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
    } else {
      await expect(
        installScheduledTask({
          dailyAt: "20:00",
          taskName: "MonoLunchMoneySync",
          configPath: "config.json",
          executor: async () => ""
        })
      ).rejects.toThrow(/Windows/);
    }
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

    expect(status.exists).toBe(process.platform === "win32");
    if (process.platform === "win32") {
      expect(status.registeredCommand).toContain("sync");
    }
  });

  it("invokes uninstall script through mocked executor on Windows", async () => {
    const scripts: string[] = [];

    if (process.platform === "win32") {
      await uninstallScheduledTask("MonoLunchMoneySync", async (script) => {
        scripts.push(script);
        return "";
      });

      expect(scripts[0]).toContain("Unregister-ScheduledTask");
    }
  });
});
