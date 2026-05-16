import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

async function runSetupWithAnswers(answers: string[]) {
  const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-notify-"));
  const configPath = path.join(root, "config.json");
  await runSetupCommand(
    { config: configPath },
    {
      env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
      monoClient: { getClientInfo: async () => monoClientInfo() },
      budgetProvider: fakeBudgetProvider(),
      prompt: async () => answers.shift() ?? "",
      stdout: { write: () => true }
    }
  );
  return JSON.parse(readFileSync(configPath, "utf8")) as {
    notifications: {
      enabled: boolean;
      notifyOnStart: boolean;
      notifyOnSuccess: boolean;
      notifyOnFailure: boolean;
    };
  };
}

describe("setup notification prompts", () => {
  it("saves disabled notification defaults", async () => {
    const config = await runSetupWithAnswers(["no", "", "", "", "yes", "1", ""]);

    expect(config.notifications).toMatchObject({ enabled: false, notifyOnSuccess: false });
  });

  it("saves enabled failure-only notifications", async () => {
    const config = await runSetupWithAnswers(["no", "", "", "yes", "no", "yes", "1", ""]);

    expect(config.notifications).toMatchObject({
      enabled: true,
      notifyOnStart: true,
      notifyOnSuccess: false,
      notifyOnFailure: true
    });
  });

  it("saves enabled success notifications", async () => {
    const config = await runSetupWithAnswers(["no", "", "", "yes", "yes", "yes", "1", ""]);

    expect(config.notifications).toMatchObject({
      enabled: true,
      notifyOnStart: true,
      notifyOnSuccess: true
    });
  });
});
