import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup ignored Monobank accounts", () => {
  it("stores explicitly selected Monobank sources in a dedicated ignored list", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-ignore-"));
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
                {
                  id: "mono-ignored",
                  type: "white",
                  currencyCode: 980,
                  balance: 10000,
                  maskedPan: ["4444******2222"]
                },
                {
                  id: "mono-tracked",
                  type: "black",
                  currencyCode: 980,
                  balance: 20000,
                  maskedPan: ["4444******1111"]
                }
              ]
            })
        },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        stdout: { write: (chunk) => void (stdout += chunk) }
      }
    );

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      ignoredMonobankAccounts: Array<{ monoAccountId: string; enabled: boolean }>;
      accounts: Array<{ monoAccountId: string }>;
    };

    expect(config.ignoredMonobankAccounts).toEqual([
      expect.objectContaining({ enabled: true, monoAccountId: "mono-ignored" })
    ]);
    expect(config.accounts).toEqual([expect.objectContaining({ monoAccountId: "mono-tracked" })]);
    expect(stdout).toContain("Ignored Transfer Sources");
  });
});
