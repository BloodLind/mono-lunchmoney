import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  appendTextCreatingParent,
  getSchedulerLauncherPath,
  writeTextCreatingParent
} from "../../../src/config/runtime-files.js";

describe("runtime file helpers", () => {
  it("creates parent directories only when writing", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-runtime-"));
    const filePath = path.join(root, "nested", "error.log");

    expect(existsSync(path.dirname(filePath))).toBe(false);
    await writeTextCreatingParent(filePath, "first");
    await appendTextCreatingParent(filePath, "\nsecond");

    expect(readFileSync(filePath, "utf8")).toBe("first\nsecond");
  });

  it("builds a deterministic scheduler launcher path under the runtime directory", () => {
    const root = "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney";

    expect(getSchedulerLauncherPath(root, "MonoLunchMoneySync")).toBe(
      "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\MonoLunchMoneySync.vbs"
    );
    expect(getSchedulerLauncherPath(root, 'Mono:Lunch/Money*Sync')).toBe(
      "C:\\Users\\Ada\\AppData\\Roaming\\mono-lunchmoney\\Mono-Lunch-Money-Sync.vbs"
    );
  });
});
