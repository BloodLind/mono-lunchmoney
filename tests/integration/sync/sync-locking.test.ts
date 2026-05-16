import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CliError } from "../../../src/cli/command-registry.js";
import { runSync } from "../../../src/sync/sync-runner.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient } from "../../fixtures/providers.js";

function base(lockPath: string) {
  return {
    mode: "sync" as const,
    config: appConfig(),
    configPath: "config.json",
    lockPath,
    statementClient: fakeStatementClient([[]]),
    budgetProvider: fakeBudgetProvider(),
    logWriter: { success: async () => undefined, error: async () => undefined },
    now: new Date("2026-05-16T00:00:00")
  };
}

describe("sync locking", () => {
  it("fails when a live lock exists", async () => {
    const lockPath = path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-lock-")), "sync.lock");
    writeFileSync(lockPath, JSON.stringify({ pid: process.pid, createdAt: new Date(), command: "sync" }), "utf8");

    await expect(runSync(base(lockPath))).rejects.toBeInstanceOf(CliError);
  });

  it("recovers a stale lock", async () => {
    const lockPath = path.join(mkdtempSync(path.join(os.tmpdir(), "mono-sync-lock-")), "sync.lock");
    writeFileSync(
      lockPath,
      JSON.stringify({ pid: 999999, createdAt: "2026-05-15T00:00:00.000Z", command: "sync" }),
      "utf8"
    );

    await expect(runSync(base(lockPath))).resolves.toMatchObject({ hadFailure: false });
  });
});
