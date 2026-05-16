#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createProgram } from "./cli/program.js";
import { exitCodeFor, messageFor } from "./cli/command-registry.js";
import { createBackfillCommand } from "./commands/backfill.command.js";
import { createConfigCommand } from "./commands/config.command.js";
import { createCredentialsCommand } from "./commands/credentials.command.js";
import { createHelpCommand } from "./commands/help.command.js";
import { createSchedulerCommand } from "./commands/scheduler.command.js";
import { createSetupCommand } from "./commands/setup.command.js";
import { createSyncCommand } from "./commands/sync.command.js";

export function createCliProgram() {
  const program = createProgram();
  program.addCommand(createSetupCommand());
  program.addCommand(createSyncCommand({ stdout: process.stdout, stderr: process.stderr }));
  program.addCommand(createBackfillCommand({ stdout: process.stdout, stderr: process.stderr }));
  program.addCommand(createSchedulerCommand({ stdout: process.stdout }));
  program.addCommand(createConfigCommand({ stdout: process.stdout }));
  program.addCommand(createCredentialsCommand({ stdout: process.stdout }));
  program.addCommand(createHelpCommand({ stdout: process.stdout }));
  return program;
}

export async function run(argv = process.argv): Promise<void> {
  try {
    await createCliProgram().parseAsync(argv);
  } catch (error) {
    process.stderr.write(`${messageFor(error)}\n`);
    process.exitCode = exitCodeFor(error);
  }
}

export function isCliEntrypoint(moduleUrl: string, invokedPath: string | undefined): boolean {
  if (!invokedPath) {
    return false;
  }

  const modulePath = realPath(resolve(fileURLToPath(moduleUrl)));
  const invoked = realPath(resolve(invokedPath));
  if (process.platform === "win32") {
    return modulePath.toLowerCase() === invoked.toLowerCase();
  }
  return modulePath === invoked;
}

function realPath(path: string): string {
  try {
    return realpathSync.native(path);
  } catch {
    return path;
  }
}

if (isCliEntrypoint(import.meta.url, process.argv[1])) {
  await run();
}
