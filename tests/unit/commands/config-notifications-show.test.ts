import { describe, expect, it } from "vitest";
import { sanitizedConfigSummary } from "../../../src/config/config.loader.js";
import { appConfig } from "../../fixtures/config.js";

describe("config show notification sanitization", () => {
  it("includes notification settings without token-like values", () => {
    const summary = JSON.stringify(
      sanitizedConfigSummary(
        appConfig({
          notifications: {
            enabled: true,
            notifyOnSuccess: true,
            notifyOnFailure: true,
            notifyOnPartialFailure: true,
            notifyOnLockHeld: true
          }
        })
      )
    );

    expect(summary).toContain("notifications");
    expect(summary).toContain("notifyOnSuccess");
    expect(summary).not.toMatch(/MONO_TOKEN|LUNCHMONEY_TOKEN|secret/i);
  });
});
