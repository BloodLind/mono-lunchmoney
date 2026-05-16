import { describe, expect, it } from "vitest";
import { sanitizedConfigSummary } from "../../../src/config/config.loader.js";
import { appConfig, accountMapping, ignoredMonobankAccount } from "../../fixtures/config.js";

describe("config show sanitization", () => {
  it("omits raw Monobank ids and masks account-like values", () => {
    const summary = JSON.stringify(
      sanitizedConfigSummary(
        appConfig({
          ignoredMonobankAccounts: [
            {
              enabled: true,
              monoAccountId: "ignored-secret-mono-account-id-1234567890",
              monoDisplayName: "Ignored 5555444433332222",
              monoCurrencyCode: 980,
              currency: "uah"
            }
          ],
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
    expect(summary).not.toContain("ignored-secret-mono-account-id-1234567890");
    expect(summary).not.toContain("4444333322221111");
    expect(summary).not.toContain("5555444433332222");
    expect(summary).toContain("4444...1111");
    expect(summary).toContain("5555...2222");
    expect(summary).toContain("UA12...4567");
  });

  it("shows ignored transfer source matcher availability without raw hashes", () => {
    const rawHash = "a".repeat(64);
    const summary = JSON.stringify(
      sanitizedConfigSummary(
        appConfig({
          ignoredMonobankAccounts: [
            ignoredMonobankAccount({
              monoAccountId: "ignored-transfer-source-secret-id",
              ibanSha256: rawHash
            })
          ]
        })
      )
    );

    expect(summary).toContain("ignoredTransferSummary");
    expect(summary).toContain("hasIbanMatcher");
    expect(summary).toContain("true");
    expect(summary).not.toContain("ignored-transfer-source-secret-id");
    expect(summary).not.toContain(rawHash);
  });
});
