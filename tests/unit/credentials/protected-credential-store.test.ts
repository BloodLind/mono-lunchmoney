import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ProtectedCredentialStore, type SecretProtector } from "../../../src/credentials/protected-credential-store.js";

class ReversibleProtector implements SecretProtector {
  async protect(secret: string): Promise<string> {
    return Buffer.from(secret, "utf8").toString("base64");
  }

  async unprotect(encryptedSecret: string): Promise<string> {
    return Buffer.from(encryptedSecret, "base64").toString("utf8");
  }
}

class FailingProtector implements SecretProtector {
  async protect(): Promise<string> {
    throw new Error("protected storage unavailable for mono-secure-token-1234567890");
  }

  async unprotect(): Promise<string> {
    throw new Error("protected storage unavailable for mono-secure-token-1234567890");
  }
}

describe("protected credential store", () => {
  it("stores an encrypted record and reads the secret through the protector", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-credentials-"));
    const store = new ProtectedCredentialStore({
      appDataDirectory: root,
      protector: new ReversibleProtector(),
      now: () => new Date("2026-05-16T00:00:00Z")
    });

    await store.saveCredential("monobank", "mono-secure-token-1234567890");

    const recordPath = store.recordPath("monobank");
    const stored = readFileSync(recordPath, "utf8");
    expect(stored).not.toContain("mono-secure-token-1234567890");
    expect(stored).toContain("windows-dpapi-current-user");
    await expect(store.readCredential("monobank")).resolves.toMatchObject({
      success: true,
      secret: "mono-secure-token-1234567890"
    });
  });

  it("treats removal as a successful no-op when the credential is missing", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-credentials-"));
    const store = new ProtectedCredentialStore({ appDataDirectory: root, protector: new ReversibleProtector() });

    await expect(store.removeCredential("lunchmoney")).resolves.toMatchObject({
      success: true,
      operation: "remove"
    });
  });

  it("reports corrupted or inaccessible records without returning the secret", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-credentials-"));
    const store = new ProtectedCredentialStore({ appDataDirectory: root, protector: new FailingProtector() });
    const recordPath = store.recordPath("monobank");
    mkdirSync(path.dirname(recordPath), { recursive: true });
    writeFileSync(
      recordPath,
      JSON.stringify({
        schemaVersion: 1,
        provider: "monobank",
        encryptedSecret: "not-readable",
        savedAt: "2026-05-16T00:00:00Z",
        protection: "windows-dpapi-current-user"
      }),
      "utf8"
    );

    await expect(store.readCredential("monobank")).resolves.toMatchObject({
      success: false,
      source: "inaccessible"
    });
    await expect(store.getStatus("monobank")).resolves.toMatchObject({
      source: "inaccessible",
      health: "inaccessible"
    });
  });

  it("fails closed when protected storage cannot save and does not create plaintext files", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "mono-credentials-"));
    const store = new ProtectedCredentialStore({ appDataDirectory: root, protector: new FailingProtector() });

    await expect(store.saveCredential("monobank", "mono-secure-token-1234567890")).rejects.toThrow(
      /Failed to save protected credential/
    );

    const recordPath = store.recordPath("monobank");
    expect(existsSync(recordPath)).toBe(false);
  });
});
