import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { memoryCredentialStore, SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup environment token migration", () => {
  it("migrates environment tokens to protected storage without writing them to config", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-migrate-"));
    const configPath = path.join(root, "config.json");
    const credentialStore = memoryCredentialStore();
    const answers = ["", "", "", "no", "yes", "1", ""];

    await runSetupCommand(
      { config: configPath },
      {
        env: {
          APPDATA: root,
          MONO_TOKEN: SAMPLE_MONO_TOKEN,
          LUNCHMONEY_TOKEN: SAMPLE_LUNCHMONEY_TOKEN
        },
        credentialStore,
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: fakeBudgetProvider(),
        prompt: async () => answers.shift() ?? "",
        stdout: { write: () => true }
      }
    );

    expect(credentialStore.saved).toEqual({
      monobank: SAMPLE_MONO_TOKEN,
      lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
    });
    const written = readFileSync(configPath, "utf8");
    expect(written).not.toContain(SAMPLE_MONO_TOKEN);
    expect(written).not.toContain(SAMPLE_LUNCHMONEY_TOKEN);
  });
});
