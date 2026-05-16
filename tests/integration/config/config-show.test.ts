import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runConfigShow } from "../../../src/commands/config.command.js";
import { appConfig } from "../../fixtures/config.js";

describe("config show integration", () => {
  it("prints a sanitized config from a real path", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-config-show-"));
    const configPath = path.join(root, "config.json");
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");
    let output = "";

    runConfigShow({ config: configPath }, { env: { APPDATA: root }, stdout: { write: (chunk: string) => void (output += chunk) } });

    const plain = stripAnsi(output);
    expect(plain).toMatch(/Config exists:\s+yes/);
    expect(plain).toContain("Monobank Black UAH");
    expect(plain).not.toContain("MONO_TOKEN");
  });
});
