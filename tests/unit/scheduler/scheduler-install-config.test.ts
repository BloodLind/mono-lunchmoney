import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createSchedulerCommand } from "../../../src/commands/scheduler.command.js";
import { appConfig } from "../../fixtures/config.js";

describe("scheduler install config", () => {
  it("persists scheduler settings and generates a token-free command", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-scheduler-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");
    let script = "";
    let output = "";

    const command = createSchedulerCommand({
      executor: async (value) => void (script = value),
      stdout: { write: (chunk: string) => void (output += chunk) }
    });

    await command.parseAsync(["install", "--daily-at", "20:00", "--config", configPath], { from: "user" });

    const config = JSON.parse(readFileSync(configPath, "utf8")) as { scheduler: { enabled: boolean; dailyAt: string } };
    expect(config.scheduler).toMatchObject({ enabled: true, dailyAt: "20:00" });
    expect(output).toContain("sync --config");
    expect(script).not.toMatch(/token/i);
  });
});
