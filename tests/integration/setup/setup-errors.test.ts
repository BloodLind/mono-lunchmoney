import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CliError } from "../../../src/cli/command-registry.js";
import { runSetupCommand } from "../../../src/commands/setup.command.js";
import { fakeBudgetProvider } from "../../fixtures/providers.js";

describe("setup errors", () => {
  it("fails when credentials are missing", async () => {
    await expect(
      runSetupCommand(
        { config: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-setup-error-")), "config.json") },
        { env: {}, prompt: async () => "", stdout: { write: () => true } }
      )
    ).rejects.toBeInstanceOf(CliError);
  });

  it("fails when Monobank returns no sources", async () => {
    await expect(
      runSetupCommand(
        { config: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-setup-error-")), "config.json") },
        {
          env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm" },
          monoClient: { getClientInfo: async () => ({ accounts: [] }) },
          budgetProvider: fakeBudgetProvider(),
          prompt: async () => "",
          stdout: { write: () => true }
        }
      )
    ).rejects.toThrow(/No Monobank/);
  });
});
