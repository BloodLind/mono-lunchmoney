import { EXIT_CODES, type ExitCode } from "./command-registry.js";

export class CliError extends Error {
  readonly exitCode: ExitCode;

  constructor(message: string, exitCode: ExitCode = EXIT_CODES.USER_ERROR) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

export function exitCodeFor(error: unknown): ExitCode {
  if (error instanceof CliError) {
    return error.exitCode;
  }
  return EXIT_CODES.USER_ERROR;
}

export function messageFor(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
