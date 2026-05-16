import { mkdir, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProviderName } from "../credentials/credential-types.js";

export async function ensureParentDirectory(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeTextCreatingParent(filePath: string, content: string): Promise<void> {
  await ensureParentDirectory(filePath);
  await writeFile(filePath, content, "utf8");
}

export async function appendTextCreatingParent(filePath: string, content: string): Promise<void> {
  await ensureParentDirectory(filePath);
  await appendFile(filePath, content, "utf8");
}

export function getCredentialDirectory(appDataDirectory: string): string {
  return path.join(appDataDirectory, "credentials");
}

export function getCredentialRecordPath(
  appDataDirectory: string,
  provider: ProviderName
): string {
  return path.join(getCredentialDirectory(appDataDirectory), `${provider}.credential.json`);
}

export function getSchedulerLauncherPath(appDataDirectory: string, taskName: string): string {
  const safeTaskName = [...taskName]
    .map((character) => {
      const isWindowsReserved = /[<>:"/\\|?*]/.test(character);
      return isWindowsReserved || character.charCodeAt(0) < 32 ? "-" : character;
    })
    .join("");
  return path.join(appDataDirectory, `${safeTaskName}.vbs`);
}
