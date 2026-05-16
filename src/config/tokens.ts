import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";

export type ProviderTokens = {
  monoToken: string;
  lunchMoneyToken: string;
};

export function resolveProviderTokens(env: NodeJS.ProcessEnv = process.env): ProviderTokens {
  const monoToken = env.MONO_TOKEN?.trim();
  const lunchMoneyToken = env.LUNCHMONEY_TOKEN?.trim();

  const missing = [
    monoToken ? undefined : "MONO_TOKEN",
    lunchMoneyToken ? undefined : "LUNCHMONEY_TOKEN"
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new CliError(
      `Missing required environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(
        ", "
      )}`,
      EXIT_CODES.USER_ERROR
    );
  }

  return {
    monoToken: monoToken!,
    lunchMoneyToken: lunchMoneyToken!
  };
}
