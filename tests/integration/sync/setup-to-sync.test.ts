import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { loadConfig } from "../../../src/config/config.loader.js";
import { runSync } from "../../../src/sync/sync-runner.js";
import { fakeBudgetProvider, fakeStatementClient, monoClientInfo, monoStatementItem } from "../../fixtures/providers.js";

describe("setup to sync mocked happy path", () => {
  it("creates config during setup and imports through sync runner", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-e2e-"));
    const configPath = path.join(root, "config.json");
    const provider = fakeBudgetProvider();
    const answers = ["", "", "no", "yes", "1", ""];

    await runSetupCommand(
      { config: configPath },
      {
        env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
        monoClient: { getClientInfo: async () => monoClientInfo() },
        budgetProvider: provider,
        prompt: async () => answers.shift() ?? "",
        stdout: { write: () => true }
      }
    );

    const loaded = loadConfig(configPath);
    if (!loaded.exists) throw new Error("expected setup config");

    await runSync({
      mode: "sync",
      config: loaded.config,
      configPath,
      lockPath: path.join(root, "sync.lock"),
      statementClient: fakeStatementClient([[monoStatementItem()]]),
      budgetProvider: provider,
      logWriter: { success: async () => undefined, error: async () => undefined },
      now: new Date("2026-05-16T00:00:00")
    });

    expect(provider.imports).toHaveLength(1);
    expect(provider.imports[0].transactions[0]).toMatchObject({
      asset_id: 111,
      status: "uncleared",
      tags: ["monobank-sync"]
    });
  });
});
