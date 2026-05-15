import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("package contents", () => {
  it("passes package validation without runtime files or secrets", () => {
    const result = spawnSync(process.execPath, ["scripts/validate-package.mjs"], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "" }
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("Package validation passed");
  });
});
