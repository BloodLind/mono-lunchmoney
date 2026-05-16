import { rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppConfig } from "./config.model.js";
import type { NotificationConfig } from "./config.model.js";
import { ensureParentDirectory } from "./runtime-files.js";

const SECRET_KEY_PATTERN = /(?:token|secret|password|authorization)/i;

export function stripConfigSecrets<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      if (SECRET_KEY_PATTERN.test(key)) {
        return undefined;
      }
      return item;
    })
  ) as T;
}

export async function writeConfig(configPath: string, config: AppConfig): Promise<void> {
  await ensureParentDirectory(configPath);
  const cleaned = stripConfigSecrets(config);
  const tempPath = path.join(
    path.dirname(configPath),
    `.${path.basename(configPath)}.${process.pid}.${Date.now()}.tmp`
  );

  await writeFile(tempPath, `${JSON.stringify(cleaned, null, 2)}\n`, { encoding: "utf8" });
  await rename(tempPath, configPath);
}

export function withNotificationConfig(
  config: AppConfig,
  notifications: NotificationConfig
): AppConfig {
  return {
    ...config,
    notifications
  };
}
