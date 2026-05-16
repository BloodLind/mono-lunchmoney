import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoAccount, monoClientInfo } from "../../fixtures/providers.js";

describe("setup ignored transfer sources", () => {
  it("saves ignored transfer sources separately from Lunch Money mappings", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-ignore-transfer-"));
    const configPath = path.join(root, "config.json");
    const answers = ["no", "", "", "no", "no", "yes", "yes", "1", "", "no", "no"];
    let stdout = "";

    await runSetupCommand(
      { config: configPath },
      {
        env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
        monoClient: {
          getClientInfo: async () =>
            monoClientInfo({
              accounts: [
                monoAccount({
                  id: "mono-ignored-source",
                  type: "white",
                  maskedPan: ["4444******2222"],
                  iban: "UA987654321098765432109876543"
                }),
                monoAccount({
                  id: "mono-imported-source",
                  type: "black",
                  maskedPan: ["4444******1111"],
                  iban: "UA123456789012345678901234567"
                })
              ]
            })
        },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        stdout: { write: (chunk) => void (stdout += chunk) }
      }
    );

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      ignoredMonobankAccounts: Array<{
        monoAccountId: string;
        maskedPan?: string;
        ibanSha256?: string;
      }>;
      accounts: Array<{ monoAccountId: string }>;
    };

    expect(config.ignoredMonobankAccounts).toEqual([
      expect.objectContaining({
        monoAccountId: "mono-ignored-source",
        maskedPan: "4444******2222",
        ibanSha256: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    ]);
    expect(config.accounts).toEqual([
      expect.objectContaining({ monoAccountId: "mono-imported-source" })
    ]);
    expect(config.ignoredMonobankAccounts[0].ibanSha256).not.toContain("UA987654");
    const plain = stripAnsi(stdout);
    expect(plain).toContain("Ignored Transfer Sources");
    expect(plain).toContain("Mappings");
    expect(plain).not.toContain("UA987654321098765432109876543");
  });
});
