import { describe, expect, it } from "vitest";
import { buildScheduledSyncCommand } from "../../../src/scheduler/windows-task-scheduler.js";

describe("scheduler command construction", () => {
  it("builds quiet sync command with config path", () => {
    const command = buildScheduledSyncCommand({
      configPath: "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\config.json"
    });

    expect(command.commandLine).toContain("mono-lunchmoney sync");
    expect(command.commandLine).toContain("--config");
    expect(command.commandLine).toContain("--quiet");
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
});
