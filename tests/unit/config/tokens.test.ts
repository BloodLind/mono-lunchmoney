import { describe, expect, it } from "vitest";
import { CliError } from "../../../src/cli/command-registry.js";
import {
  credentialStatusesWithEnvironment,
  resolveProviderTokens,
  resolveProviderTokensWithSources
} from "../../../src/config/tokens.js";
import { memoryCredentialStore } from "../../fixtures/credentials.js";

describe("provider token resolver", () => {
  it("prefers protected storage over environment values", async () => {
    const store = memoryCredentialStore({ monobank: "mono-protected", lunchmoney: "lm-protected" });

    await expect(
      resolveProviderTokens(
        { MONO_TOKEN: "mono-env", LUNCHMONEY_TOKEN: "lm-env" },
        store
      )
    ).resolves.toEqual({
      monoToken: "mono-protected",
      lunchMoneyToken: "lm-protected"
    });
  });

  it("uses environment values as compatibility source when protected values are missing", async () => {
    const store = memoryCredentialStore();

    await expect(
      resolveProviderTokensWithSources(
        { MONO_TOKEN: "mono-env", LUNCHMONEY_TOKEN: "lm-env" },
        store
      )
    ).resolves.toEqual({
      tokens: {
        monoToken: "mono-env",
        lunchMoneyToken: "lm-env"
      },
      sources: {
        monobank: "environment",
        lunchmoney: "environment"
      }
    });
  });

  it("throws a user-facing error when credentials are missing", async () => {
    const store = memoryCredentialStore();

    await expect(resolveProviderTokens({ MONO_TOKEN: "mono" }, store)).rejects.toBeInstanceOf(CliError);
    await expect(resolveProviderTokens({}, store)).rejects.toThrow(/credentials set/);
  });

  it("fails closed when protected storage is inaccessible", async () => {
    const store = memoryCredentialStore({ lunchmoney: "lm" });
    store.inaccessibleProviders.add("monobank");

    await expect(
      resolveProviderTokens({ MONO_TOKEN: "mono-env", LUNCHMONEY_TOKEN: "lm-env" }, store)
    ).rejects.toThrow(/inaccessible/);
  });

  it("reports environment credential status without exposing values", async () => {
    const statuses = await credentialStatusesWithEnvironment(
      { MONO_TOKEN: "mono-env", LUNCHMONEY_TOKEN: "lm-env" },
      memoryCredentialStore()
    );

    expect(statuses).toEqual([
      expect.objectContaining({ provider: "monobank", source: "environment", health: "ready" }),
      expect.objectContaining({ provider: "lunchmoney", source: "environment", health: "ready" })
    ]);
    expect(JSON.stringify(statuses)).not.toContain("mono-env");
    expect(JSON.stringify(statuses)).not.toContain("lm-env");
  });
});
