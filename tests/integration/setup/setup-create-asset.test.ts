import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider, monoClientInfo } from "../../fixtures/providers.js";

describe("setup with Lunch Money asset creation", () => {
  it("creates an asset and maps the Monobank source to the returned id", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-setup-create-"));
    const answers = ["no", "", "", "no", "yes", "1", "New Monobank", "", ""];
    const provider = fakeBudgetProvider([]);

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

    const written = JSON.parse(readFileSync(path.join(root, "config.json"), "utf8")) as {
      accounts: Array<{ lunchMoneyAssetId: number; lunchMoneyAccountName: string }>;
    };
    expect(provider.created[0]).toMatchObject({ name: "New Monobank", typeName: "cash" });
    expect(written.accounts[0]).toMatchObject({ lunchMoneyAssetId: 222, lunchMoneyAccountName: "New Monobank" });
  });
});
