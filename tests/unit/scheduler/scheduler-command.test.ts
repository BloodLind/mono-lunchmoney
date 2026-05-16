import { describe, expect, it } from "vitest";
import {
  buildHiddenScheduledTaskAction,
  buildScheduledSyncCommand
} from "../../../src/scheduler/windows-task-scheduler.js";
import {
  SCHEDULER_FIXTURE_CONFIG_PATH,
  SCHEDULER_FIXTURE_LAUNCHER_PATH,
  expectNoSchedulerSecrets
} from "../../fixtures/scheduler.js";

describe("scheduler command construction", () => {
  it("builds quiet sync command with config path", () => {
    const command = buildScheduledSyncCommand({
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH
    });

    expect(command.commandLine).toContain("mono-lunchmoney sync");
    expect(command.commandLine).toContain("--config");
    expect(command.commandLine).toContain("--quiet");
    expect(command.commandLine).not.toMatch(/token/i);
  });

  it("can build a Task Scheduler-safe node script command without relying on PATH", () => {
    const command = buildScheduledSyncCommand({
      nodeExecutable: "C:\\Program Files\\nodejs\\node.exe",
      cliScriptPath: "D:\\apps\\mono-lunchmoney\\dist\\cli.js",
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH
    });

    expect(command.execute).toBe("C:\\Program Files\\nodejs\\node.exe");
    expect(command.arguments[0]).toBe("D:\\apps\\mono-lunchmoney\\dist\\cli.js");
    expect(command.commandLine).toContain('"C:\\Program Files\\nodejs\\node.exe"');
    expect(command.commandLine).toContain('"D:\\apps\\mono-lunchmoney\\dist\\cli.js"');
    expect(command.commandLine).toContain("sync --config");
    expect(command.commandLine).not.toMatch(/token/i);
  });

  it("rejects token-like executable arguments", () => {
    expect(() =>
      buildScheduledSyncCommand({
        cliCommand: "mono-lunchmoney --mono-token secret",
        configPath: "config.json"
      })
    ).toThrow(/token/i);
  });

  it("wraps the sync command in a consoleless WScript task action", () => {
    const command = buildScheduledSyncCommand({
      cliCommand: "mono-lunchmoney",
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH
    });
    const action = buildHiddenScheduledTaskAction(command, SCHEDULER_FIXTURE_LAUNCHER_PATH);

    expect(action.execute).toBe("wscript.exe");
    expect(action.arguments).toContain("//B");
    expect(action.arguments).toContain("//Nologo");
    expect(action.arguments).toContain('"C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\MonoLunchMoneySync.vbs"');
    expect(action.arguments).not.toContain("Start-Process");
    expectNoSchedulerSecrets(action.arguments);
  });

  it("writes launcher content that runs hidden, waits, and returns the sync exit code", () => {
    const command = buildScheduledSyncCommand({
      cliCommand: "mono-lunchmoney",
      configPath: SCHEDULER_FIXTURE_CONFIG_PATH
    });
    const action = buildHiddenScheduledTaskAction(command, SCHEDULER_FIXTURE_LAUNCHER_PATH);

    expect(action.wrapperScriptContent).toContain("mono-lunchmoney sync");
    expect(action.wrapperScriptContent).toContain("--config");
    expect(action.wrapperScriptContent).toContain("--quiet");
    expect(action.wrapperScriptContent).toContain("shell.Run(command, 0, True)");
    expect(action.wrapperScriptContent).toContain("WScript.Quit exitCode");
    expect(action.wrapperScriptContent).toContain("mono-lunchmoney-scheduler-command:");
    expect(action.wrapperScriptContent).toContain("mono-lunchmoney-scheduler-mode: hidden background");
    expect(action.wrapperScriptContent).not.toMatch(/InputBox|MsgBox|WScript\.Echo/i);
    expectNoSchedulerSecrets(action.wrapperScriptContent);
  });
});
