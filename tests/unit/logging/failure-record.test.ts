import { describe, expect, it } from "vitest";
import { formatFailureRecord } from "../../../src/logging/logger.js";

describe("failure record sanitization", () => {
  it("does not expose credentials or full account identifiers", () => {
    const line = formatFailureRecord({
      source: "scheduler",
      message: "Authorization Bearer abc123 and IBAN UA213223130000026007233566001",
      exitCode: 2
    });

    expect(line).not.toContain("abc123");
    expect(line).not.toContain("UA213223130000026007233566001");
    expect(line).toContain("UA21...6001");
  });
});
