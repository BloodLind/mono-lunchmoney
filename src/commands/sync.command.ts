import { existsSync } from "node:fs";
import { Command } from "commander";
import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { writeFailureRecord } from "../logging/logger.js";

export type SyncOptions = {
  config?: string;
  quiet?: boolean;
  dryRun?: boolean;
  lookbackDays?: string;
};

export type SyncDeps = {
  env?: NodeJS.ProcessEnv;
  stderr?: Pick<NodeJS.WriteStream, "write">;
};

export async function runSyncCommand(options: SyncOptions, deps: SyncDeps = {}): Promise<void> {
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });

  if (!existsSync(paths.configPath)) {
    const message = `Config not found: ${paths.configPath}`;
    await writeFailureRecord(paths.errorLogPath, {
      source: "sync",
      message,
      exitCode: EXIT_CODES.USER_ERROR,
      logPath: paths.errorLogPath
    });
    if (!options.quiet) {
      deps.stderr?.write(`${message}\n`);
    }
    throw new CliError(message, EXIT_CODES.USER_ERROR);
  }

  const message = "Sync import is not implemented in this initialization feature slice.";
  await writeFailureRecord(paths.errorLogPath, {
    source: "sync",
    message,
    exitCode: EXIT_CODES.USER_ERROR,
    logPath: paths.errorLogPath
  });
  throw new CliError(message, EXIT_CODES.USER_ERROR);
}

export function createSyncCommand(deps: SyncDeps = {}): Command {
  return new Command("sync")
    .description("Import recent mapped transactions")
    .option("--config <path>", "explicit config path")
    .option("--quiet", "suppress non-error output for scheduled use")
    .option("--dry-run", "preview sync without importing")
    .option("--lookback-days <days>", "recent sync lookback days")
    .action((options: SyncOptions) => runSyncCommand(options, deps));
}
