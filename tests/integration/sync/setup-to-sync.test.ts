import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { loadConfig } from "../../../src/config/config.loader.js";
import { runSync } from "../../../src/sync/sync-runner.js";
import { sha256Hex } from "../../../src/utils/hash.js";
import {
  fakeBudgetProvider,
  fakeStatementClient,
  monoAccount,
  monoClientInfo,
  monoStatementItem,
  monoTransferFromIgnoredSource
} from "../../fixtures/providers.js";

describe("setup to sync mocked happy path", () => {
  it("creates config during setup and imports through sync runner", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-e2e-"));
    const configPath = path.join(root, "config.json");
    const provider = fakeBudgetProvider();
    const answers = ["no", "", "", "no", "yes", "1", ""];

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

  it("uses the updated ignored transfer list from setup when syncing later", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-e2e-ignore-transfer-"));
    const configPath = path.join(root, "config.json");
    const provider = fakeBudgetProvider();
    const answers = ["no", "", "", "no", "no", "yes", "yes", "1", "", "no", "no"];

    await runSetupCommand(
      { config: configPath },
      {
        env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root },
        monoClient: {
          getClientInfo: async () =>
            monoClientInfo({
              accounts: [
                monoAccount({
                  id: "ignored-card",
                  maskedPan: ["4444******2222"],
                  iban: "UA987654321098765432109876543"
                }),
                monoAccount({
                  id: "imported-card",
                  maskedPan: ["4444******1111"],
                  iban: "UA123456789012345678901234567"
                })
              ]
            })
        },
        budgetProvider: provider,
        prompt: async () => answers.shift() ?? "",
        stdout: { write: () => true }
      }
    );

    const loaded = loadConfig(configPath);
    if (!loaded.exists) throw new Error("expected setup config");
    expect(loaded.config.ignoredMonobankAccounts[0]).toMatchObject({
      monoAccountId: "ignored-card",
      ibanSha256: sha256Hex("UA987654321098765432109876543")
    });

    await runSync({
      mode: "sync",
      config: loaded.config,
      configPath,
      lockPath: path.join(root, "sync.lock"),
      statementClient: fakeStatementClient([
        [monoTransferFromIgnoredSource(), monoStatementItem({ id: "normal-after-setup" })]
      ]),
      budgetProvider: provider,
      logWriter: { success: async () => undefined, error: async () => undefined },
      now: new Date("2026-05-16T00:00:00")
    });

    expect(provider.imports).toHaveLength(1);
    expect(provider.imports[0].transactions).toHaveLength(1);
    expect(provider.imports[0].transactions[0].external_id).toContain("normal-after-setup");
  });
});
