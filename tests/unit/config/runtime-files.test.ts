import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appendTextCreatingParent, writeTextCreatingParent } from "../../../src/config/runtime-files.js";

describe("runtime file helpers", () => {
  it("creates parent directories only when writing", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-runtime-"));
    const filePath = path.join(root, "nested", "error.log");

    expect(existsSync(path.dirname(filePath))).toBe(false);
    await writeTextCreatingParent(filePath, "first");
    await appendTextCreatingParent(filePath, "\nsecond");

    expect(readFileSync(filePath, "utf8")).toBe("first\nsecond");
  });
});
