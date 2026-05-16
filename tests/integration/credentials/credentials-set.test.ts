import { describe, expect, it } from "vitest";
import { runCredentialsSet } from "../../../src/commands/credentials.command.js";
import { memoryCredentialStore, SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";

describe("credentials set", () => {
  it("prompts for all providers, validates before saving, and never accepts token CLI options", async () => {
    const store = memoryCredentialStore();
    const validated: string[] = [];
    const answers = [SAMPLE_MONO_TOKEN, SAMPLE_LUNCHMONEY_TOKEN];

    await runCredentialsSet(
      { provider: "all" },
      {
        credentialStore: store,
        prompt: async () => answers.shift() ?? "",
        validateMonobankToken: async (token) => void validated.push(`mono:${token}`),
        validateLunchMoneyToken: async (token) => void validated.push(`lunch:${token}`),
        stdout: { write: () => true }
      }
    );

    expect(validated).toEqual([`mono:${SAMPLE_MONO_TOKEN}`, `lunch:${SAMPLE_LUNCHMONEY_TOKEN}`]);
    expect(store.saved).toEqual({
      monobank: SAMPLE_MONO_TOKEN,
      lunchmoney: SAMPLE_LUNCHMONEY_TOKEN
    });
  });

  it("replaces a single provider only after successful validation", async () => {
    const store = memoryCredentialStore({ monobank: "old-token" });
    const answers = ["yes", SAMPLE_MONO_TOKEN];

    await runCredentialsSet(
      { provider: "monobank" },
      {
        credentialStore: store,
        prompt: async () => answers.shift() ?? "",
        validateMonobankToken: async () => undefined,
        stdout: { write: () => true }
      }
    );

    expect(store.saved.monobank).toBe(SAMPLE_MONO_TOKEN);
  });

  it("does not replace a saved token when validation fails", async () => {
    const store = memoryCredentialStore({ lunchmoney: "old-token" });
    const answers = ["yes", SAMPLE_LUNCHMONEY_TOKEN];

    await expect(
      runCredentialsSet(
        { provider: "lunchmoney" },
        {
          credentialStore: store,
          prompt: async () => answers.shift() ?? "",
          validateLunchMoneyToken: async () => {
            throw new Error(`bad ${SAMPLE_LUNCHMONEY_TOKEN}`);
          },
          stdout: { write: () => true }
        }
      )
    ).rejects.toThrow(/validation failed/);

    expect(store.saved.lunchmoney).toBe("old-token");
  });
});
