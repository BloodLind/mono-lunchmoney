import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoAccount, monoClientInfo } from "../../fixtures/providers.js";

describe("setup ignored transfer choices", () => {
  it("does not save a skipped import source as ignored unless the user selects it", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-ignore-choice-"));
    const configPath = path.join(root, "config.json");
    const answers = ["no", "", "", "no", "no", "no", "yes", "1", "", "no", "no"];

    await runSetupCommand(
      { config: configPath },
      {
        env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
        monoClient: {
          getClientInfo: async () =>
            monoClientInfo({
              accounts: [
                monoAccount({ id: "skipped-not-ignored", type: "white" }),
                monoAccount({ id: "tracked-not-ignored", type: "black" })
              ]
            })
        },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        stdout: { write: () => true }
      }
    );

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      ignoredMonobankAccounts: Array<{ monoAccountId: string }>;
      accounts: Array<{ monoAccountId: string }>;
    };
    expect(config.ignoredMonobankAccounts).toEqual([]);
    expect(config.accounts).toEqual([expect.objectContaining({ monoAccountId: "tracked-not-ignored" })]);
  });
});
