import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  bin: Record<string, string>;
  engines: Record<string, string>;
  files: string[];
};

describe("package bin metadata", () => {
  it("exposes mono-lunchmoney as an installable command", () => {
    expect(pkg.bin["mono-lunchmoney"]).toBe("./dist/cli.js");
    expect(pkg.engines.node).toBeDefined();
    expect(pkg.files).toContain("dist/");
  });
});
