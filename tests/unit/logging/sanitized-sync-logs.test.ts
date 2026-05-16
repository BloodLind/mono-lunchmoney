import { describe, expect, it } from "vitest";
import { formatFailureRecord, formatSyncRecord } from "../../../src/logging/logger.js";

describe("sanitized sync logs", () => {
  it("sanitizes success and error messages", () => {
    const success = formatSyncRecord("Synced 4444333322221111 with MONO_TOKEN=secret");
    const error = formatFailureRecord({
      source: "sync",
      message: "Authorization Bearer secret-token and UA123456789012345678901234567 failed"
    });

    expect(success).not.toContain("4444333322221111");
    expect(success).not.toContain("secret");
    expect(error).not.toContain("secret-token");
    expect(error).toContain("UA12...4567");
  });
});
