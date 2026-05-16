import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup with existing Lunch Money asset", () => {
  it("maps a tracked Monobank source to an existing asset without saving tokens", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-"));
    const answers = ["no", "", "01.05.2026", "no", "yes", "1", ""];
    const provider = fakeBudgetProvider();

    await runSetupCommand(
      { config: path.join(root, "config.json") },
      {
        env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: provider,
        prompt: async () => answers.shift() ?? "",
        stdout: { write: () => true }
      }
    );

    const written = readFileSync(path.join(root, "config.json"), "utf8");
    expect(written).toContain("lunchMoneyAssetId");
    expect(written).toContain('"baselineDate": "2026-05-01"');
    expect(written).not.toContain("mono\"");
    expect(written).not.toContain("lm");
  });
});
