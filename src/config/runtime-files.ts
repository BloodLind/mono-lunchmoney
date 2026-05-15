import { mkdir, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
