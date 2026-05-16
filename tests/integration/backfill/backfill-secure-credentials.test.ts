import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runBackfillCommand } from "../../../src/commands/backfill.command.js";
import { appConfig } from "../../fixtures/config.js";
import { memoryCredentialStore, SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";

describe("backfill secure credentials", () => {
  it("uses saved protected credentials without environment variables or prompts", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-backfill-credentials-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");
    const provider = fakeBudgetProvider();
    const usedTokens: string[] = [];

    await runBackfillCommand(
      { config: configPath, from: "2026-05-01", to: "2026-05-15", quiet: true },
      {
        env: { APPDATA: root },
        credentialStore: memoryCredentialStore({
          monobank: SAMPLE_MONO_TOKEN,
          lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
        }),
        createStatementClient: (token) => {
          usedTokens.push(token);
          return fakeStatementClient([[monoStatementItem()]]);
        },
        createBudgetProvider: (token) => {
          usedTokens.push(token);
          return provider;
        },
        logWriter: { success: async () => undefined, error: async () => undefined },
        notificationAdapter: { notify: async () => undefined }
      }
    );

    expect(usedTokens).toEqual([SAMPLE_MONO_TOKEN, SAMPLE_LUNCHMONEY_TOKEN]);
    expect(provider.imports).toHaveLength(1);
  });
});
