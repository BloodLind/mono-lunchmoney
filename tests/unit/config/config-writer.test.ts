import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeConfig } from "../../../src/config/config.writer.js";
import { appConfig } from "../../fixtures/config.js";
import { SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";

describe("config writer", () => {
  it("creates parent directories and never persists token-like keys", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-writer-"));
    const configPath = path.join(root, "nested", "config.json");
    const config = {
      ...appConfig(),
      MONO_TOKEN: SAMPLE_MONO_TOKEN,
      nested: { lunchMoneyToken: SAMPLE_MONO_TOKEN }
    };

    await writeConfig(configPath, config);

    const written = readFileSync(configPath, "utf8");
    expect(written).toContain("mono-account-1");
    expect(written).not.toContain(SAMPLE_MONO_TOKEN);
    expect(written).not.toMatch(/token/i);
  });
});
