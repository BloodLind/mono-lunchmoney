import { Command } from "commander";
import { CliError } from "../cli/errors.js";
import { EXIT_CODES } from "../cli/command-registry.js";

export function createBackfillCommand(): Command {
  return new Command("backfill")
    .description("Import historical transactions for a date range")
    .option("--config <path>", "explicit config path")
    .option("--from <date>", "start date in YYYY-MM-DD")
    .option("--to <date>", "end date in YYYY-MM-DD")
    .action(() => {
      throw new CliError(
        "Backfill is not implemented in this initialization feature slice.",
        EXIT_CODES.USER_ERROR
      );
    });
}
