import { describe, expect, it } from "vitest";
import { CliError } from "../../../src/cli/errors.js";
import { resolveProviderTokens } from "../../../src/config/tokens.js";

describe("provider token resolver", () => {
  it("returns tokens from environment", () => {
    expect(resolveProviderTokens({ MONO_TOKEN: "mono", LUNCHMONEY_TOKEN: "lm" })).toEqual({
      monoToken: "mono",
      lunchMoneyToken: "lm"
    });
  });

  it("throws a user-facing error when a token is missing", () => {
    expect(() => resolveProviderTokens({ MONO_TOKEN: "mono" })).toThrow(CliError);
    expect(() => resolveProviderTokens({})).toThrow(/MONO_TOKEN/);
  });
});
