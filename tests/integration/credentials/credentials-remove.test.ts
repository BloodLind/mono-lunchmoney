import { describe, expect, it } from "vitest";
import { runCredentialsRemove } from "../../../src/commands/credentials.command.js";
import { memoryCredentialStore, SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";

describe("credentials remove", () => {
  it("removes all providers with --yes and leaves mappings untouched", async () => {
    const store = memoryCredentialStore({
      monobank: SAMPLE_MONO_TOKEN,
      lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
    });

    await runCredentialsRemove(
      { provider: "all", yes: true },
      { credentialStore: store, stdout: { write: () => true } }
    );

    expect(store.saved).toEqual({});
  });

  it("requires confirmation without --yes", async () => {
    const store = memoryCredentialStore({ monobank: SAMPLE_MONO_TOKEN });

    await runCredentialsRemove(
      { provider: "monobank" },
      {
        credentialStore: store,
        prompt: async () => "no",
        stdout: { write: () => true }
      }
    );

    expect(store.saved.monobank).toBe(SAMPLE_MONO_TOKEN);

    await runCredentialsRemove(
      { provider: "monobank" },
      {
        credentialStore: store,
        prompt: async () => "yes",
        stdout: { write: () => true }
      }
    );

    expect(store.saved.monobank).toBeUndefined();
  });
});
