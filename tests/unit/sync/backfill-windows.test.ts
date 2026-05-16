import { describe, expect, it } from "vitest";
import { splitBackfillWindows } from "../../../src/sync/backfill-windows.js";

describe("backfill windows", () => {
  it("splits inclusive date ranges into provider-safe windows", () => {
    const windows = splitBackfillWindows("2026-01-01", "2026-02-05");

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({ fromDate: "2026-01-01", toDate: "2026-01-31" });
    expect(windows[1]).toMatchObject({ fromDate: "2026-02-01", toDate: "2026-02-05" });
    for (const window of windows) {
      expect(window.to - window.from).toBeLessThanOrEqual(31 * 24 * 60 * 60);
    }
  });
});
