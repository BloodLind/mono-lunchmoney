import { describe, expect, it } from "vitest";
import { parseAppConfig } from "../../../src/config/config.model.js";
import { sanitizedConfigSummary } from "../../../src/config/config.loader.js";
import { appConfig } from "../../fixtures/config.js";

describe("baseline date config", () => {
  it("accepts an optional YYYY-MM-DD baseline date", () => {
    const parsed = parseAppConfig({ ...appConfig(), baselineDate: "2026-05-01" });

    expect(parsed.baselineDate).toBe("2026-05-01");
    expect(JSON.stringify(sanitizedConfigSummary(parsed))).toContain("2026-05-01");
  });

  it("rejects invalid baseline dates", () => {
    expect(() => parseAppConfig({ ...appConfig(), baselineDate: "2026-99-99" })).toThrow();
  });
});
