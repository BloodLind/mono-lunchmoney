import { Command } from "commander";
import { CliError } from "../cli/errors.js";
import { EXIT_CODES } from "../cli/command-registry.js";

export function createSetupCommand(): Command {
  return new Command("setup")
    .description("Interactive setup for Monobank and Lunch Money mappings")
    .action(() => {
      throw new CliError(
        "Setup is not implemented in this initialization feature slice.",
        EXIT_CODES.USER_ERROR
      );
    });
}
