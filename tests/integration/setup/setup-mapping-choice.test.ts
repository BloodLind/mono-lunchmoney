import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup mapping choice", () => {
  it("reprompts invalid Lunch Money account choices instead of creating an account implicitly", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-choice-"));
    const answers = ["no", "", "", "no", "yes", "99", "1", ""];
    let stdout = "";
    const provider = fakeBudgetProvider();

    await runSetupCommand(
      { config: path.join(root, "config.json") },
      {
        env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: provider,
        prompt: async () => answers.shift() ?? "",
        stdout: {
          write(text: string) {
            stdout += text;
            return true;
          }
        }
      }
    );

    expect(stdout).toContain("Choose a number from 1 to 2.");
    expect(provider.created).toHaveLength(0);
    expect(readFileSync(path.join(root, "config.json"), "utf8")).toContain("lunchMoneyAssetId");
  });
});
