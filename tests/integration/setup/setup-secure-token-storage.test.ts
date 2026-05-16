import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { memoryCredentialStore, SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup secure token storage", () => {
  it("saves entered tokens to protected storage after provider validation", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-secure-"));
    const configPath = path.join(root, "config.json");
    const credentialStore = memoryCredentialStore();
    const answers = [SAMPLE_MONO_TOKEN, SAMPLE_LUNCHMONEY_TOKEN, "", "", "", "no", "yes", "1", ""];
    let stdout = "";

    await runSetupCommand(
      { config: configPath },
      {
        env: { APPDATA: root },
        credentialStore,
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        stdout: { write: (chunk: string) => void (stdout += chunk) }
      }
    );

    expect(credentialStore.saved).toEqual({
      monobank: SAMPLE_MONO_TOKEN,
      lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
    });
    const config = readFileSync(configPath, "utf8");
    expect(config).not.toContain(SAMPLE_MONO_TOKEN);
    expect(config).not.toContain(SAMPLE_LUNCHMONEY_TOKEN);
    expect(stripAnsi(stdout)).toContain("Saved provider tokens to protected storage");
  });

  it("uses existing protected credentials without asking for token values", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-secure-"));
    const credentialStore = memoryCredentialStore({
      monobank: SAMPLE_MONO_TOKEN,
      lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
    });
    const prompts: string[] = [];
    const answers = ["", "", "no", "yes", "1", ""];

    await runSetupCommand(
      { config: path.join(root, "config.json") },
      {
        env: { APPDATA: root },
        credentialStore,
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: fakeBudgetProvider(),
        prompt: async (question) => {
          prompts.push(question);
          return answers.shift() ?? "";
        },
        stdout: { write: () => true }
      }
    );

    expect(prompts.join("\n")).not.toContain("Paste Monobank API token");
    expect(prompts.join("\n")).not.toContain("Paste Lunch Money API token");
  });
});
