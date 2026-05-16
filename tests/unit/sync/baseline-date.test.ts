import { describe, expect, it } from "vitest";
import { clampWindowsToBaseline, runSync } from "../../../src/sync/sync-runner.js";
import { appConfig } from "../../fixtures/config.js";
import { fakeBudgetProvider, fakeStatementClient, monoStatementItem } from "../../fixtures/providers.js";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("sync baseline date", () => {
  it("clamps fetch windows to the configured baseline date", () => {
    const clamped = clampWindowsToBaseline([{ from: 1, to: 2_000_000_000 }], "2026-05-01");
    const expected = Math.floor(new Date(2026, 4, 1).getTime() / 1000);

    expect(clamped).toEqual([{ from: expected, to: 2_000_000_000 }]);
  });

  it("drops windows fully before the baseline date", () => {
    expect(clampWindowsToBaseline([{ from: 1, to: 2 }], "2026-05-01")).toEqual([]);
  });

  it("does not fetch transactions before baseline during sync", async () => {
    const client = fakeStatementClient([[monoStatementItem()]]);

    await runSync({
      mode: "sync",
      config: appConfig({ baselineDate: "2026-05-10" }),
      configPath: "config.json",
      lockPath: path.join(mkdtempSync(path.join(os.tmpdir(), "mono-baseline-")), "sync.lock"),
      statementClient: client,
      budgetProvider: fakeBudgetProvider(),
      logWriter: { success: async () => undefined, error: async () => undefined },
      now: new Date("2026-05-16T00:00:00"),
      lookbackDays: 31
    });

    const [{ from }] = client.calls as Array<{ from: number }>;
    expect(from).toBe(Math.floor(new Date(2026, 4, 10).getTime() / 1000));
  });
});
