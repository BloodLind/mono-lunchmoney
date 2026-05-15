import { describe, expect, it } from "vitest";
import { schedulerInstallOptionsSchema } from "../../../src/config/config.model.js";

describe("scheduler option schema", () => {
  it("accepts valid HH:mm and applies default task name", () => {
    const parsed = schedulerInstallOptionsSchema.parse({ dailyAt: "20:00" });

    expect(parsed.dailyAt).toBe("20:00");
    expect(parsed.taskName).toBe("MonoLunchMoneySync");
  });

  it("rejects invalid time values", () => {
    expect(() => schedulerInstallOptionsSchema.parse({ dailyAt: "25:99" })).toThrow();
  });
});
