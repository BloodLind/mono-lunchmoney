import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { runCredentialsStatus } from "../../../src/commands/credentials.command.js";
import { memoryCredentialStore, SAMPLE_LUNCHMONEY_TOKEN, SAMPLE_MONO_TOKEN } from "../../fixtures/credentials.js";

describe("credentials status", () => {
  it("reports saved, missing, environment, and inaccessible states without token values", async () => {
    const store = memoryCredentialStore({ monobank: SAMPLE_MONO_TOKEN });
    let output = "";

    await runCredentialsStatus(
      {},
      {
        env: { LUNCHMONEY_TOKEN: SAMPLE_LUNCHMONEY_TOKEN },
        credentialStore: store,
        stdout: { write: (chunk) => void (output += chunk) }
      }
    );

    const plain = stripAnsi(output);
    expect(plain).toContain("Monobank:");
    expect(plain).toContain("protected storage");
    expect(plain).toContain("Lunch Money:");
    expect(plain).toContain("environment");
    expect(plain).not.toContain(SAMPLE_MONO_TOKEN);
    expect(plain).not.toContain(SAMPLE_LUNCHMONEY_TOKEN);

    store.inaccessibleProviders.add("monobank");
    output = "";
    await runCredentialsStatus({}, { env: {}, credentialStore: store, stdout: { write: (chunk) => void (output += chunk) } });
    expect(stripAnsi(output)).toContain("inaccessible");
  });
});
