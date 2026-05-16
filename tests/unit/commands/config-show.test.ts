import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runConfigShow } from "../../../src/commands/config.command.js";

describe("config show command", () => {
  it("prints runtime paths and setup guidance when config is missing", () => {
    let output = "";
    runConfigShow(
      {},
      {
        env: { APPDATA: "C:\\Users\\Ada\\AppData\\Roaming" },
        stdout: { write: (chunk: string) => (output += chunk) }
      }
    );

    const plain = stripAnsi(output);
    expect(plain).toMatch(/Config exists:\s+no/);
    expect(plain).toContain("mono-lunchmoney");
    expect(plain).not.toContain("MONO_TOKEN");
  });
});
