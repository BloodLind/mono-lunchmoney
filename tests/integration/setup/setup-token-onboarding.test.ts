import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";
import { memoryCredentialStore } from "../../fixtures/credentials.js";

describe("setup token onboarding", () => {
  it("prompts for missing API tokens, shows token links, and keeps tokens out of config", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-token-"));
    const configPath = path.join(root, "config.json");
    const env: NodeJS.ProcessEnv = { APPDATA: root };
    const answers = [
      "mono-from-prompt",
      "lunch-from-prompt",
      "",
      "",
      "",
      "no",
      "yes",
      "1",
      ""
    ];
    const saved: unknown[] = [];
    const credentialStore = memoryCredentialStore();
    let stdout = "";

    await runSetupCommand(
      { config: configPath },
      {
        env,
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        credentialStore,
        stdout: {
          write(text: string) {
            stdout += text;
            return true;
          }
        }
      }
    );

    expect(stdout).toContain("https://api.monobank.ua/");
    expect(stdout).toContain("https://my.lunchmoney.app/developers");
    expect(stdout).toContain("Found Monobank accounts/cards");
    saved.push({ ...credentialStore.saved });
    expect(saved).toEqual([
      {
        monobank: "mono-from-prompt",
        lunchmoney: "lunch-from-prompt"
      }
    ]);
    expect(env.MONO_TOKEN).toBeUndefined();
    expect(env.LUNCHMONEY_TOKEN).toBeUndefined();

    const written = readFileSync(configPath, "utf8");
    expect(written).toContain("lunchMoneyAssetId");
    expect(written).not.toContain("mono-from-prompt");
    expect(written).not.toContain("lunch-from-prompt");
  });
});
