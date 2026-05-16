import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { CliError, EXIT_CODES } from "../cli/command-registry.js";
import { ensureParentDirectory, getCredentialRecordPath } from "../config/runtime-files.js";
import { sanitizeText } from "../utils/masking.js";
import {
  assertNonEmptySecret,
  inaccessibleReadResult,
  inaccessibleStatus,
  missingReadResult,
  missingStatus,
  protectedStatus,
  removedResult,
  savedResult,
  type CredentialStore
} from "./credential-store.js";
import {
  type CredentialOperationResult,
  type CredentialReadResult,
  type CredentialStatusSummary,
  type ProtectedCredentialRecord,
  type ProviderName
} from "./credential-types.js";

export type SecretProtector = {
  protect(secret: string): Promise<string>;
  unprotect(encryptedSecret: string): Promise<string>;
};

export type ProtectedCredentialStoreOptions = {
  appDataDirectory: string;
  protector?: SecretProtector;
  now?: () => Date;
};

export class ProtectedCredentialStore implements CredentialStore {
  private readonly appDataDirectory: string;
  private readonly protector: SecretProtector;
  private readonly now: () => Date;

  constructor(options: ProtectedCredentialStoreOptions) {
    this.appDataDirectory = options.appDataDirectory;
    this.protector = options.protector ?? new PowerShellDpapiSecretProtector();
    this.now = options.now ?? (() => new Date());
  }

  async saveCredential(provider: ProviderName, secret: string): Promise<CredentialOperationResult> {
    const trimmed = assertNonEmptySecret(provider, secret);
    const recordPath = this.recordPath(provider);
    const existed = existsSync(recordPath);

    try {
      const encryptedSecret = await this.protector.protect(trimmed);
      const record: ProtectedCredentialRecord = {
        schemaVersion: 1,
        provider,
        encryptedSecret,
        savedAt: this.now().toISOString(),
        protection: "windows-dpapi-current-user"
      };
      await ensureParentDirectory(recordPath);
      const tempPath = path.join(
        path.dirname(recordPath),
        `.${path.basename(recordPath)}.${process.pid}.${Date.now()}.tmp`
      );
      await writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
      await rename(tempPath, recordPath);
      return savedResult(provider, existed);
    } catch (error) {
      throw new CliError(
        `Failed to save protected credential: ${sanitizeText(error instanceof Error ? error.message : error)}`,
        EXIT_CODES.EXTERNAL_ERROR
      );
    }
  }

  async readCredential(provider: ProviderName): Promise<CredentialReadResult> {
    let record: ProtectedCredentialRecord | undefined;
    try {
      record = this.readRecord(provider);
    } catch (error) {
      return inaccessibleReadResult(provider, error instanceof Error ? error.message : error);
    }
    if (!record) {
      return missingReadResult(provider);
    }

    try {
      const secret = await this.protector.unprotect(record.encryptedSecret);
      if (!secret.trim()) {
        return inaccessibleReadResult(provider, "stored credential decrypted to an empty value");
      }
      return {
        success: true,
        provider,
        secret,
        savedAt: record.savedAt,
        lastValidatedAt: record.lastValidatedAt
      };
    } catch (error) {
      return inaccessibleReadResult(provider, error instanceof Error ? error.message : error);
    }
  }

  async removeCredential(provider: ProviderName): Promise<CredentialOperationResult> {
    await rm(this.recordPath(provider), { force: true });
    return removedResult(provider);
  }

  async getStatus(provider: ProviderName): Promise<CredentialStatusSummary> {
    let record: ProtectedCredentialRecord | undefined;
    try {
      record = this.readRecord(provider);
    } catch (error) {
      return inaccessibleStatus(provider, error instanceof Error ? error.message : error);
    }
    if (!record) {
      return missingStatus(provider);
    }

    try {
      await this.protector.unprotect(record.encryptedSecret);
      return protectedStatus(provider, {
        savedAt: record.savedAt,
        lastValidatedAt: record.lastValidatedAt
      });
    } catch (error) {
      return inaccessibleStatus(provider, error instanceof Error ? error.message : error);
    }
  }

  recordPath(provider: ProviderName): string {
    return getCredentialRecordPath(this.appDataDirectory, provider);
  }

  private readRecord(provider: ProviderName): ProtectedCredentialRecord | undefined {
    const recordPath = this.recordPath(provider);
    if (!existsSync(recordPath)) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(readFileSync(recordPath, "utf8")) as ProtectedCredentialRecord;
      if (
        parsed.schemaVersion !== 1 ||
        parsed.provider !== provider ||
        typeof parsed.encryptedSecret !== "string" ||
        !parsed.encryptedSecret
      ) {
        throw new Error("credential record is invalid");
      }
      return parsed;
    } catch (error) {
      throw new CliError(
        `Failed to read protected credential metadata: ${sanitizeText(
          error instanceof Error ? error.message : error
        )}`,
        EXIT_CODES.EXTERNAL_ERROR
      );
    }
  }
}

export class PowerShellDpapiSecretProtector implements SecretProtector {
  async protect(secret: string): Promise<string> {
    assertWindowsProtectedStorage();
    const script = [
      "$ErrorActionPreference = 'Stop'",
      "$Encoded = [Console]::In.ReadToEnd()",
      "$Bytes = [Convert]::FromBase64String($Encoded)",
      "$Secret = [Text.Encoding]::UTF8.GetString($Bytes)",
      "$Secure = ConvertTo-SecureString -String $Secret -AsPlainText -Force",
      "ConvertFrom-SecureString -SecureString $Secure"
    ].join("; ");
    return runPowerShellEncoded(script, Buffer.from(secret, "utf8").toString("base64"));
  }

  async unprotect(encryptedSecret: string): Promise<string> {
    assertWindowsProtectedStorage();
    const script = [
      "$ErrorActionPreference = 'Stop'",
      "$Encrypted = [Console]::In.ReadToEnd().Trim()",
      "$Secure = ConvertTo-SecureString -String $Encrypted",
      "$Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)",
      "try {",
      "$Plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Bstr)",
      "$Bytes = [Text.Encoding]::UTF8.GetBytes($Plain)",
      "[Console]::Out.Write([Convert]::ToBase64String($Bytes))",
      "} finally {",
      "if ($Bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr) }",
      "}"
    ].join("; ");
    const encoded = await runPowerShellEncoded(script, encryptedSecret);
    return Buffer.from(encoded, "base64").toString("utf8");
  }
}

function assertWindowsProtectedStorage(): void {
  if (process.platform !== "win32") {
    throw new CliError(
      "Protected credential storage is currently available only on Windows.",
      EXIT_CODES.EXTERNAL_ERROR
    );
  }
}

function runPowerShellEncoded(script: string, stdin: string): Promise<string> {
  const encodedCommand = Buffer.from(script, "utf16le").toString("base64");
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      encodedCommand
    ]);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      reject(
        new CliError(
          `Protected credential operation failed: ${sanitizeText(error.message)}`,
          EXIT_CODES.EXTERNAL_ERROR
        )
      );
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(
        new CliError(
          `Protected credential operation failed: ${sanitizeText(stderr.trim() || `exit ${code}`)}`,
          EXIT_CODES.EXTERNAL_ERROR
        )
      );
    });
    child.stdin.end(stdin);
  });
}
