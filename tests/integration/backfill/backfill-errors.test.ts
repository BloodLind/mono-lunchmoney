import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runBackfillCommand } from "../../../src/commands/backfill.command.js";
import { splitBackfillWindows } from "../../../src/sync/backfill-windows.js";

describe("backfill errors", () => {
  it("rejects invalid date ranges", () => {
    expect(() => splitBackfillWindows("2026-05-15", "2026-01-01")).toThrow(/--to/);
  });

  it("fails clearly when config is missing", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-backfill-error-"));
    await expect(
      runBackfillCommand(
        { config: path.join(root, "missing.json"), from: "2026-01-01", to: "2026-01-02" },
        { env: { MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm", APPDATA: root } }
      )
    ).rejects.toThrow(/Config not found/);
  });
});
