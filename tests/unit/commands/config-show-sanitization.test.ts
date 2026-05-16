import { describe, expect, it } from "vitest";
import { sanitizedConfigSummary } from "../../../src/config/config.loader.js";
import { appConfig, accountMapping } from "../../fixtures/config.js";

describe("config show sanitization", () => {
  it("omits raw Monobank ids and masks account-like values", () => {
    const summary = JSON.stringify(
      sanitizedConfigSummary(
        appConfig({
          accounts: [
            accountMapping({
              monoAccountId: "secret-mono-account-id-1234567890",
              monoDisplayName: "Mono 4444333322221111 UA123456789012345678901234567",
              externalIdPrefix: "mono:secret-mono-account-id-1234567890"
            })
          ]
        })
      )
    );

    expect(summary).not.toContain("secret-mono-account-id-1234567890");
    expect(summary).not.toContain("4444333322221111");
    expect(summary).toContain("4444...1111");
    expect(summary).toContain("UA12...4567");
  });
});
