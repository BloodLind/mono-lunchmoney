import os from "node:os";
import path from "node:path";
import { APP_DIRECTORY_NAME } from "../cli/command-registry.js";

export type RuntimePathOptions = {
  configPath?: string;
  env?: NodeJS.ProcessEnv;
};

export type RuntimePaths = {
  appDataDirectory: string;
  configPath: string;
  syncLogPath: string;
  errorLogPath: string;
  lockPath: string;
};

export function getDefaultAppDataDirectory(env: NodeJS.ProcessEnv = process.env): string {
  if (env.MONO_LUNCHMONEY_HOME) {
    return path.resolve(env.MONO_LUNCHMONEY_HOME);
  }

  if (env.APPDATA) {
    return path.join(env.APPDATA, APP_DIRECTORY_NAME);
  }

  if (env.XDG_CONFIG_HOME) {
    return path.join(env.XDG_CONFIG_HOME, APP_DIRECTORY_NAME);
  }

  return path.join(env.USERPROFILE ?? os.homedir(), `.${APP_DIRECTORY_NAME}`);
}

export function resolveRuntimePaths(options: RuntimePathOptions = {}): RuntimePaths {
  const env = options.env ?? process.env;
  const appDataDirectory = getDefaultAppDataDirectory(env);

  return {
    appDataDirectory,
    configPath: options.configPath
      ? path.resolve(options.configPath)
      : path.join(appDataDirectory, "config.json"),
    syncLogPath: path.join(appDataDirectory, "sync.log"),
    errorLogPath: path.join(appDataDirectory, "error.log"),
    lockPath: path.join(appDataDirectory, "sync.lock")
  };
}
