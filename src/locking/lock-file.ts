import { open, readFile, stat, unlink } from "node:fs/promises";
import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { ensureParentDirectory } from "../config/runtime-files.js";

export type LockCommand = "sync" | "backfill";

export type LockMetadata = {
  pid: number;
  createdAt: string;
  command: LockCommand;
};

export type LockHandle = {
  path: string;
  metadata: LockMetadata;
  release(): Promise<void>;
};

export async function acquireLockFile(
  lockPath: string,
  command: LockCommand,
  options: {
    staleMs?: number;
    now?: () => Date;
    isProcessAlive?: (pid: number) => boolean;
  } = {}
): Promise<LockHandle> {
  await ensureParentDirectory(lockPath);
  const now = options.now ?? (() => new Date());
  const metadata: LockMetadata = {
    pid: process.pid,
    createdAt: now().toISOString(),
    command
  };

  try {
    const file = await open(lockPath, "wx");
    await file.writeFile(JSON.stringify(metadata), "utf8");
    await file.close();
    return createHandle(lockPath, metadata);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EEXIST") {
      throw error;
    }
  }

  if (await isExistingLockStale(lockPath, options)) {
    await unlink(lockPath).catch(() => undefined);
    return acquireLockFile(lockPath, command, options);
  }

  throw new CliError(`Sync lock is already held: ${lockPath}`, EXIT_CODES.LOCKED);
}

async function isExistingLockStale(
  lockPath: string,
  options: {
    staleMs?: number;
    now?: () => Date;
    isProcessAlive?: (pid: number) => boolean;
  }
): Promise<boolean> {
  const staleMs = options.staleMs ?? 6 * 60 * 60 * 1000;
  const now = options.now ?? (() => new Date());
  let metadata: Partial<LockMetadata> = {};

  try {
    metadata = JSON.parse(await readFile(lockPath, "utf8")) as Partial<LockMetadata>;
  } catch {
    metadata = {};
  }

  const createdAt = metadata.createdAt ? new Date(metadata.createdAt).getTime() : undefined;
  const fileStat = await stat(lockPath);
  const age = now().getTime() - (createdAt ?? fileStat.mtimeMs);
  if (age > staleMs) {
    return true;
  }

  if (typeof metadata.pid === "number") {
    const isAlive = options.isProcessAlive ?? processIsAlive;
    return !isAlive(metadata.pid);
  }

  return false;
}

function createHandle(lockPath: string, metadata: LockMetadata): LockHandle {
  return {
    path: lockPath,
    metadata,
    async release() {
      await unlink(lockPath).catch(() => undefined);
    }
  };
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
