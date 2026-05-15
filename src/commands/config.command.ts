import { Command } from "commander";
import { formatConfigShow, loadConfig } from "../config/config.loader.js";
import { resolveRuntimePaths } from "../config/paths.js";

export type ConfigShowOptions = {
  config?: string;
};

export type ConfigDeps = {
  env?: NodeJS.ProcessEnv;
  stdout?: Pick<NodeJS.WriteStream, "write">;
};

export function runConfigShow(options: ConfigShowOptions, deps: ConfigDeps = {}): void {
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const loaded = loadConfig(paths.configPath);
  const output = formatConfigShow(paths, loaded);
  deps.stdout?.write(output);
}

export function createConfigCommand(deps: ConfigDeps = {}): Command {
  const command = new Command("config").description("Inspect sanitized configuration");

  command
    .command("show")
    .description("Print sanitized config and runtime paths")
    .option("--config <path>", "explicit config path")
    .action((options: ConfigShowOptions) => runConfigShow(options, deps));

  return command;
}
