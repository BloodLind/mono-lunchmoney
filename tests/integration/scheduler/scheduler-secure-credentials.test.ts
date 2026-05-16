import { describe, expect, it } from "vitest";
import {
  buildHiddenScheduledTaskAction,
  buildScheduledSyncCommand,
  parseSchedulerStatus
} from "../../../src/scheduler/windows-task-scheduler.js";
import {
  SCHEDULER_FIXTURE_CONFIG_PATH,
  SCHEDULER_FIXTURE_LAUNCHER_PATH,
  expectNoSchedulerSecrets
} from "../../fixtures/scheduler.js";

describe("scheduler secure credentials", () => {
  it("does not include provider tokens in scheduled command text, launcher content, or status output", () => {
    const scheduled = buildScheduledSyncCommand({
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH
    });
    const action = buildHiddenScheduledTaskAction(scheduled, SCHEDULER_FIXTURE_LAUNCHER_PATH);
    const status = parseSchedulerStatus(
      JSON.stringify({
        TaskName: "MonoLunchMoneySync",
        Execute: action.execute,
        Arguments: action.arguments,
        RegisteredCommand: scheduled.commandLine,
        Mode: "hidden background",
        NextRunTime: "2026-05-17 20:00:00",
        LastRunTime: "2026-05-16 20:00:00",
        LastTaskResult: 0
      })
    );

    expect(scheduled.commandLine).toContain("sync --config");
    expect(action.wrapperScriptContent).toContain("shell.Run(command, 0, True)");
    expect(status.registeredCommand).toBe(scheduled.commandLine);
    expectNoSchedulerSecrets(scheduled.commandLine);
    expectNoSchedulerSecrets(action.arguments);
    expectNoSchedulerSecrets(action.wrapperScriptContent);
    expectNoSchedulerSecrets(status.registeredCommand ?? "");
  });
});
