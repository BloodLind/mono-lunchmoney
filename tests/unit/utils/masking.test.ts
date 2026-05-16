import { describe, expect, it } from "vitest";
import { hasTokenLikeArgument, sanitizeObject, sanitizeText } from "../../../src/utils/masking.js";

describe("masking utilities", () => {
  it("detects token-like command arguments", () => {
    expect(hasTokenLikeArgument(["sync", "--mono-token", "secret"])).toBe(true);
    expect(hasTokenLikeArgument(["sync", "--lunchmoney-token=secret"])).toBe(true);
    expect(hasTokenLikeArgument(["sync", "--config", "config.json"])).toBe(false);
  });

  it("sanitizes tokens and financial identifiers", () => {
    const value =
      'MONO_TOKEN=secret --lunchmoney-token "secret" UA213223130000026007233566001 4444333322221111';

    const sanitized = sanitizeText(value);
    expect(sanitized).not.toContain("secret");
    expect(sanitized).not.toContain("4444333322221111");
    expect(sanitized).toContain("4444...1111");
    expect(sanitized).toContain("UA21...6001");
  });

  it("redacts token keys while preserving safe object fields", () => {
    const sanitized = sanitizeObject({
      token: "secret",
      nested: { display: "Card 4444333322221111" }
    });

    expect(sanitized).toEqual({
      token: "[REDACTED]",
      nested: { display: "Card 4444...1111" }
    });
  });

  it("redacts credential-like values in errors and diagnostics", () => {
    const sanitized = sanitizeText(
      "Credential failed for mono-secure-token-1234567890 and lunch-secure-token-0987654321"
    );

    expect(sanitized).not.toContain("mono-secure-token-1234567890");
    expect(sanitized).not.toContain("lunch-secure-token-0987654321");
    expect(sanitized).toContain("mono-s...7890");
    expect(sanitized).toContain("lunch-...4321");
  });
});
