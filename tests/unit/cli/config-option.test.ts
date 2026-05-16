import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runConfigShow } from "../../../src/commands/config.command.js";

describe("explicit config path option", () => {
  it("uses explicit config path in config show output", () => {
    let output = "";
    runConfigShow(
      { config: "D:\\custom\\config.json" },
      {
        env: { APPDATA: "C:\\Users\\Ada\\AppData\\Roaming" },
        stdout: { write: (chunk: string) => (output += chunk) }
      }
    );

    const plain = stripAnsi(output);
    expect(plain).toContain("D:\\custom\\config.json");
    expect(plain).toMatch(/Config exists:\s+no/);
  });
});
