import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRuntimePaths } from "../../../src/config/paths.js";

describe("resolveRuntimePaths", () => {
  it("uses APPDATA for default Windows-friendly runtime paths", () => {
    const paths = resolveRuntimePaths({
      env: { APPDATA: "C:\\Users\\Ada\\AppData\\Roaming" }
    });

    expect(paths.appDataDirectory).toBe(
      path.join("C:\\Users\\Ada\\AppData\\Roaming", "mono-lunchmoney")
    );
    expect(paths.configPath).toBe(path.join(paths.appDataDirectory, "config.json"));
    expect(paths.syncLogPath).toBe(path.join(paths.appDataDirectory, "sync.log"));
    expect(paths.errorLogPath).toBe(path.join(paths.appDataDirectory, "error.log"));
    expect(paths.lockPath).toBe(path.join(paths.appDataDirectory, "sync.lock"));
  });

  it("uses an explicit config path without moving log and lock defaults", () => {
    const paths = resolveRuntimePaths({
      configPath: "D:\\configs\\mono.json",
      env: { APPDATA: "C:\\Users\\Ada\\AppData\\Roaming" }
    });

    expect(paths.configPath).toBe(path.resolve("D:\\configs\\mono.json"));
    expect(paths.errorLogPath).toBe(
      path.join("C:\\Users\\Ada\\AppData\\Roaming", "mono-lunchmoney", "error.log")
    );
  });
});
