import { describe, expect, it } from "vitest";
import { parseSchedulerStatus } from "../../../src/scheduler/windows-task-scheduler.js";
import { SCHEDULER_FIXTURE_CONFIG_PATH, expectNoSchedulerSecrets } from "../../fixtures/scheduler.js";

describe("scheduler status parsing", () => {
  it("returns missing status for empty scheduler output", () => {
    expect(parseSchedulerStatus("", "MonoLunchMoneySync")).toEqual({
      exists: false,
      taskName: "MonoLunchMoneySync"
    });
  });

  it("parses and sanitizes registered command output", () => {
    const status = parseSchedulerStatus(
      JSON.stringify({
        TaskName: "MonoLunchMoneySync",
        NextRunTime: "2026-05-16T20:00:00",
        LastRunTime: "2026-05-15T20:00:00",
        LastTaskResult: 1,
        Execute: "mono-lunchmoney",
        Arguments: 'sync --config "C:\\config.json" --mono-token secret --quiet'
      })
    );

    expect(status.exists).toBe(true);
    expect(status.lastResultCode).toBe(1);
    expect(status.registeredCommand).not.toContain("secret");
  });

  it("uses registered hidden launcher metadata instead of wrapper internals", () => {
    const status = parseSchedulerStatus(
      JSON.stringify({
        TaskName: "MonoLunchMoneySync",
        LastTaskResult: 0,
        Execute: "wscript.exe",
        Arguments: '//B //Nologo "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\MonoLunchMoneySync.vbs"',
        RegisteredCommand: `mono-lunchmoney sync --config "${SCHEDULER_FIXTURE_CONFIG_PATH}" --quiet`,
        Mode: "hidden background"
      })
    );

    expect(status.registeredCommand).toBe(
      `mono-lunchmoney sync --config "${SCHEDULER_FIXTURE_CONFIG_PATH}" --quiet`
    );
    expect(status.registeredCommand).not.toContain("wscript");
    expect(status.mode).toBe("hidden background");
    expectNoSchedulerSecrets(status.registeredCommand ?? "");
  });

  it("shows a concise fallback when hidden launcher metadata is unavailable", () => {
    const status = parseSchedulerStatus(
      JSON.stringify({
        TaskName: "MonoLunchMoneySync",
        LastTaskResult: 1,
        Execute: "wscript.exe",
        Arguments: '//B //Nologo "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\MonoLunchMoneySync.vbs"'
      })
    );

    expect(status.registeredCommand).toBe(
      "mono-lunchmoney sync --quiet (hidden launcher metadata unavailable)"
    );
    expect(status.mode).toBe("hidden background");
    expectNoSchedulerSecrets(status.registeredCommand ?? "");
  });

  it("shows the inner sync command for hidden PowerShell task actions", () => {
    const status = parseSchedulerStatus(
      JSON.stringify({
        TaskName: "MonoLunchMoneySync",
        LastTaskResult: 0,
        Execute: "powershell.exe",
        Arguments:
          '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$ErrorActionPreference = \'Stop\'; $Process = Start-Process -FilePath \'mono-lunchmoney\' -ArgumentList @(\'sync\', \'--config\', \'C:\\config.json\', \'--quiet\') -WindowStyle Hidden -Wait -PassThru; exit $Process.ExitCode"'
      })
    );

    expect(status.registeredCommand).toBe('mono-lunchmoney sync --config "C:\\config.json" --quiet');
  });
});
