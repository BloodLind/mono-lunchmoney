import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EXIT_CODES } from "../../../src/cli/command-registry.js";
import { CliError } from "../../../src/cli/errors.js";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, monoAccount, monoClientInfo } from "../../fixtures/providers.js";

function setupDeps(root: string, answers: string[] = ["no", "", "", "no", "yes", "1", ""]) {
  return {
    env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
    monoClient: { getClientInfo: async () => monoClientInfo() },
    budgetProvider: fakeBudgetProvider(),
    prompt: async () => answers.shift() ?? "",
    stdout: { write: () => true }
  };
}

describe("setup reconfigure behavior", () => {
  it("does not overwrite existing config unless --reconfigure is provided", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-reconfigure-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig({ defaultTag: "existing" })), "utf8");

    await expect(
      runSetupCommand({ config: configPath }, setupDeps(root))
    ).rejects.toMatchObject({ exitCode: EXIT_CODES.USER_ERROR } satisfies Partial<CliError>);

    expect(readFileSync(configPath, "utf8")).toContain("existing");
  });

  it("replaces existing config when --reconfigure is provided", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-reconfigure-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig({ defaultTag: "existing" })), "utf8");

    await runSetupCommand({ config: configPath, reconfigure: true }, setupDeps(root));

    expect(readFileSync(configPath, "utf8")).not.toContain("existing");
    expect(readFileSync(configPath, "utf8")).toContain("lunchMoneyAssetId");
  });

  it("replaces old ignored transfer source selections when --reconfigure is provided", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-reconfigure-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify(
        appConfig({
          ignoredMonobankAccounts: [
            {
              enabled: true,
              monoAccountId: "old-ignored",
              monoDisplayName: "Old Ignored",
              monoCurrencyCode: 980,
              currency: "uah"
            }
          ]
        })
      ),
      "utf8"
    );

    const answers = ["no", "", "", "no", "no", "no", "yes", "1", "", "yes", "no"];
    await runSetupCommand(
      { config: configPath, reconfigure: true },
      {
        ...setupDeps(root, answers),
        monoClient: {
          getClientInfo: async () =>
            monoClientInfo({
              accounts: [
                monoAccount({ id: "new-skipped", type: "white", maskedPan: ["4444******2222"] }),
                monoAccount({ id: "new-ignored", type: "black", maskedPan: ["4444******1111"] })
              ]
            })
        }
      }
    );

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      ignoredMonobankAccounts: Array<{ monoAccountId: string }>;
    };
    expect(config.ignoredMonobankAccounts).toEqual([
      expect.objectContaining({ monoAccountId: "new-ignored" })
    ]);
  });
});
