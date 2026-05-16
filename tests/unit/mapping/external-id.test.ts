import { describe, expect, it } from "vitest";
import { buildExternalId } from "../../../src/mapping/mono-to-lunchmoney.mapper.js";

describe("external id builder", () => {
  it("is deterministic for the same account and transaction", () => {
    expect(buildExternalId("acc", "tx")).toBe(buildExternalId("acc", "tx"));
    expect(buildExternalId("acc", "tx")).toBe("mono:acc:tx");
  });

  it("keeps values at or below Lunch Money's 75-character limit", () => {
    const id = buildExternalId("a".repeat(100), "t".repeat(100));
    expect(id).toHaveLength(54);
    expect(id.length).toBeLessThanOrEqual(75);
    expect(id).toMatch(/^mono:[a-f0-9]+:[a-f0-9]+$/);
  });
});
