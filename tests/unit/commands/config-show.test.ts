import { describe, expect, it } from "vitest";
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

    expect(output).toContain("Config exists: no");
    expect(output).toContain("mono-lunchmoney");
    expect(output).not.toContain("MONO_TOKEN");
  });
});
