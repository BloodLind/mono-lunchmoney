import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncCommand } from "../../../src/commands/sync.command.js";
import { appConfig } from "../../fixtures/config.js";
import { memoryCredentialStore } from "../../fixtures/credentials.js";

describe("sync missing secure credentials", () => {
  it("fails non-interactively with setup guidance when saved credentials are removed", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-sync-missing-credentials-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");

    await expect(
      runSyncCommand(
        { config: configPath, quiet: true },
        {
          env: { APPDATA: root },
          credentialStore: memoryCredentialStore(),
          logWriter: { success: async () => undefined, error: async () => undefined },
          notificationAdapter: { notify: async () => undefined }
        }
      )
    ).rejects.toThrow(/credentials set/);
  });
});
