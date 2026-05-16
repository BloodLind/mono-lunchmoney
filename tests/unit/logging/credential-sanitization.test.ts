import { describe, expect, it } from "vitest";
import { formatFailureRecord } from "../../../src/logging/logger.js";
import { SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";

describe("credential log sanitization", () => {
  it("redacts credential values from failure records", () => {
    const line = formatFailureRecord({
      timestamp: new Date("2026-05-16T12:00:00"),
      source: "credentials",
      message: `Provider failed with ${SAMPLE_MONO_TOKEN} for 4444333322221111`
    });

    expect(line).not.toContain(SAMPLE_MONO_TOKEN);
    expect(line).not.toContain("4444333322221111");
    expect(line).toContain("4444...1111");
  });
});
