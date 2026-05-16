import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("README command examples", () => {
  const readme = readFileSync("README.md", "utf8");

  it("documents required commands", () => {
    for (const command of ["help", "setup", "sync", "backfill", "scheduler", "config show"]) {
      expect(readme).toContain(`mono-lunchmoney ${command}`);
    }
  });

  it("documents token safety for scheduler usage", () => {
    expect(readme).toMatch(/API tokens are never included in the scheduled command/i);
  });

  it("documents notification commands", () => {
    for (const command of [
      "config notifications enable",
      "config notifications enable --success",
      "config notifications disable",
      "config notifications status"
    ]) {
      expect(readme).toContain(`mono-lunchmoney ${command}`);
    }
  });
});
