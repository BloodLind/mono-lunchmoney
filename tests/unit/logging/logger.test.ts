import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatFailureRecord, writeFailureRecord } from "../../../src/logging/logger.js";

describe("logger", () => {
  it("formats sanitized failure records", () => {
    const line = formatFailureRecord({
      timestamp: new Date("2026-05-15T20:00:01"),
      source: "sync",
      message: "failed with --mono-token secret for 4444333322221111",
      exitCode: 1
    });

    expect(line).toContain("ERROR sync exit=1");
    expect(line).not.toContain("secret");
    expect(line).not.toContain("4444333322221111");
  });

  it("writes failure records after creating parent directories", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-log-"));
    const logPath = path.join(root, "logs", "error.log");

    await writeFailureRecord(logPath, {
      source: "sync",
      message: "missing config",
      exitCode: 1
    });

    expect(readFileSync(logPath, "utf8")).toContain("missing config");
  });
});
