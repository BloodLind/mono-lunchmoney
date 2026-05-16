import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CliError } from "../../../src/cli/errors.js";
import { acquireLockFile } from "../../../src/locking/lock-file.js";

describe("lock file", () => {
  it("acquires and releases a lock", async () => {
    const lockPath = path.join(mkdtempSync(path.join(os.tmpdir(), "mono-lock-")), "sync.lock");
    const lock = await acquireLockFile(lockPath, "sync");
    expect(existsSync(lockPath)).toBe(true);
    await lock.release();
    expect(existsSync(lockPath)).toBe(false);
  });

  it("rejects live locks and recovers stale locks", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mono-lock-"));
    const lockPath = path.join(dir, "sync.lock");
    writeFileSync(
      lockPath,
      JSON.stringify({ pid: 123, createdAt: new Date("2026-05-15T00:00:00Z"), command: "sync" }),
      "utf8"
    );

    await expect(
      acquireLockFile(lockPath, "sync", {
        now: () => new Date("2026-05-15T00:01:00Z"),
        isProcessAlive: () => true
      })
    ).rejects.toBeInstanceOf(CliError);

    const lock = await acquireLockFile(lockPath, "sync", {
      now: () => new Date("2026-05-16T00:00:00Z"),
      isProcessAlive: () => true
    });
    await lock.release();
  });
});
