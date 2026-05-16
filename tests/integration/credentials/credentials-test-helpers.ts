import type { Command } from "commander";

export async function runCommand(command: Command, argv: string[]): Promise<{
  stdout: string;
  stderr: string;
}> {
  let stdout = "";
  let stderr = "";
  command.configureOutput({
    writeOut: (chunk) => {
      stdout += chunk;
    },
    writeErr: (chunk) => {
      stderr += chunk;
    }
  });
  command.exitOverride();
  await command.parseAsync(["node", "mono-lunchmoney", ...argv], { from: "user" });
  return { stdout, stderr };
}
