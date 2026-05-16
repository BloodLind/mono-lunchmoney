import { describe, expect, it } from "vitest";
import { formatDateOnly, parseFlexibleLocalDate, toLocalIsoDate } from "../../../src/utils/date.js";
import { minorUnitsToDecimalString } from "../../../src/utils/money.js";

describe("money and date utilities", () => {
  it("converts common minor-unit amounts to decimal strings", () => {
    expect(minorUnitsToDecimalString(-42050, "uah")).toBe("-420.50");
    expect(minorUnitsToDecimalString(120000, "eur")).toBe("1200.00");
    expect(minorUnitsToDecimalString(123, "jpy")).toBe("123");
  });

  it("formats transaction timestamps as local ISO dates", () => {
    const timestamp = Math.floor(new Date(2026, 4, 15, 10, 0, 0).getTime() / 1000);
    expect(toLocalIsoDate(timestamp)).toBe("2026-05-15");
  });

  it("parses friendly baseline date inputs into canonical dates", () => {
    expect(formatDateOnly(parseFlexibleLocalDate("2026/05/01"))).toBe("2026-05-01");
    expect(formatDateOnly(parseFlexibleLocalDate("01.05.2026"))).toBe("2026-05-01");
    expect(formatDateOnly(parseFlexibleLocalDate("May 1 2026"))).toBe("2026-05-01");
    expect(formatDateOnly(parseFlexibleLocalDate("yesterday", new Date(2026, 4, 16)))).toBe(
      "2026-05-15"
    );
  });
});
