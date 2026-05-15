import { describe, expect, it } from "vitest";
import { parseSchedulerStatus } from "../../../src/scheduler/windows-task-scheduler.js";

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
});
