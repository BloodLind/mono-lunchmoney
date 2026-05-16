import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runConfigShow } from "../../../src/commands/config.command.js";
import { resolveRuntimePaths } from "../../../src/config/paths.js";
import { appConfig } from "../../fixtures/config.js";
import { SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";

describe("config secure credentials display", () => {
  it("reports credential presence without exposing token values", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-config-credentials-"));
    const configPath = path.join(root, "config.json");
    const paths = resolveRuntimePaths({ configPath, env: { APPDATA: root } });
    writeFileSync(configPath, JSON.stringify(appConfig()), "utf8");
    mkdirSync(paths.credentialDirectory, { recursive: true });
    writeFileSync(paths.credentialRecordPaths.monobank, "encrypted", "utf8");
    writeFileSync(paths.credentialRecordPaths.lunchmoney, "encrypted", "utf8");
    let output = "";

    runConfigShow({ config: configPath }, { env: { APPDATA: root }, stdout: { write: (chunk) => void (output += chunk) } });

    const plain = stripAnsi(output);
    expect(plain).toMatch(/Monobank credential:\s+saved/);
    expect(plain).toMatch(/Lunch Money credential:\s+saved/);
    expect(plain).not.toContain(SAMPLE_MONO_TOKEN);
    expect(plain).not.toContain(SAMPLE_LUNCHMONEY_TOKEN);
  });
});
