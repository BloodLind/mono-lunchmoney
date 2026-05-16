import { describe, expect, it } from "vitest";
import { CliError } from "../../../src/cli/command-registry.js";
import {
  assertNonEmptySecret,
  environmentStatus,
  inaccessibleReadResult,
  missingReadResult,
  protectedStatus,
  removedResult,
  savedResult
} from "../../../src/credentials/credential-store.js";

describe("credential store helpers", () => {
  it("rejects empty secrets before storage", () => {
    expect(() => assertNonEmptySecret("monobank", "   ")).toThrow(CliError);
  });

  it("returns sanitized operation results without secret values", () => {
    expect(savedResult("monobank")).toMatchObject({
      success: true,
      operation: "save",
      provider: "monobank"
    });
    expect(removedResult("lunchmoney")).toMatchObject({
      success: true,
      operation: "remove",
      provider: "lunchmoney"
    });
    expect(JSON.stringify(savedResult("monobank"))).not.toContain("token");
  });

  it("models missing, inaccessible, protected, and environment states", () => {
    expect(missingReadResult("monobank")).toMatchObject({
      success: false,
      source: "missing",
      status: "needs-setup"
    });
    expect(inaccessibleReadResult("lunchmoney", "bad-token-123456789012345")).toMatchObject({
      success: false,
      source: "inaccessible",
      status: "inaccessible"
    });
    expect(protectedStatus("monobank")).toMatchObject({
      present: true,
      source: "protected-storage",
      health: "ready"
    });
    expect(environmentStatus("lunchmoney")).toMatchObject({
      present: true,
      source: "environment",
      health: "ready"
    });
  });
});
