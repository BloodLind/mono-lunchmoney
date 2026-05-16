import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CliError } from "../../../src/cli/command-registry.js";
import { runSyncCommand } from "../../../src/commands/sync.command.js";

describe("sync failure visibility", () => {
  it("writes a sanitized error log and returns non-zero when config is missing", async () => {
    const appData = mkdtempSync(path.join(os.tmpdir(), "mono-sync-"));
    const missingConfig = path.join(appData, "missing.json");

    await expect(
      runSyncCommand({ config: missingConfig, quiet: true }, { env: { APPDATA: appData } })
    ).rejects.toBeInstanceOf(CliError);

    const logPath = path.join(appData, "mono-lunchmoney", "error.log");
    expect(existsSync(logPath)).toBe(true);
    expect(readFileSync(logPath, "utf8")).toContain("Config not found");
  });
});
