import { Command } from "commander";
import { formatConfigShow, loadConfig } from "../config/config.loader.js";
import { writeConfig, withNotificationConfig } from "../config/config.writer.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import {
  disableNotifications,
  enableNotifications,
  getNotificationConfig
} from "../notifications/notification-config.js";

export type ConfigShowOptions = {
  config?: string;
};

export type ConfigNotificationOptions = {
  config?: string;
  success?: boolean;
  failureOnly?: boolean;
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

export async function runConfigNotificationsEnable(
  options: ConfigNotificationOptions,
  deps: ConfigDeps = {}
): Promise<void> {
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const loaded = loadConfig(paths.configPath);
  if (!loaded.exists) {
    throw new CliError(`Config not found: ${paths.configPath}`, EXIT_CODES.USER_ERROR);
  }

  const notifications = enableNotifications({
    success: options.success,
    failureOnly: options.failureOnly
  });
  await writeConfig(paths.configPath, withNotificationConfig(loaded.config, notifications));
  deps.stdout?.write(formatNotificationStatus(notifications));
}

export async function runConfigNotificationsDisable(
  options: ConfigNotificationOptions,
  deps: ConfigDeps = {}
): Promise<void> {
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const loaded = loadConfig(paths.configPath);
  if (!loaded.exists) {
    throw new CliError(`Config not found: ${paths.configPath}`, EXIT_CODES.USER_ERROR);
  }

  const notifications = disableNotifications();
  await writeConfig(paths.configPath, withNotificationConfig(loaded.config, notifications));
  deps.stdout?.write(formatNotificationStatus(notifications));
}

export function runConfigNotificationsStatus(
  options: ConfigNotificationOptions,
  deps: ConfigDeps = {}
): void {
  const paths = resolveRuntimePaths({ configPath: options.config, env: deps.env });
  const loaded = loadConfig(paths.configPath);
  if (!loaded.exists) {
    throw new CliError(`Config not found: ${paths.configPath}`, EXIT_CODES.USER_ERROR);
  }

  deps.stdout?.write(formatNotificationStatus(getNotificationConfig(loaded.config.notifications)));
}

export function formatNotificationStatus(notifications: ReturnType<typeof getNotificationConfig>): string {
  return [
    "Notification settings",
    `Notifications enabled: ${notifications.enabled ? "yes" : "no"}`,
    `Notify on success: ${notifications.notifyOnSuccess ? "yes" : "no"}`,
    `Notify on failure: ${notifications.notifyOnFailure ? "yes" : "no"}`,
    `Notify on partial failure: ${notifications.notifyOnPartialFailure ? "yes" : "no"}`,
    `Notify on lock held: ${notifications.notifyOnLockHeld ? "yes" : "no"}`
  ].join("\n") + "\n";
}

export function createConfigCommand(deps: ConfigDeps = {}): Command {
  const command = new Command("config").description("Inspect sanitized configuration");

  command
    .command("show")
    .description("Print sanitized config and runtime paths")
    .option("--config <path>", "explicit config path")
    .action((options: ConfigShowOptions) => runConfigShow(options, deps));

  const notifications = command
    .command("notifications")
    .description("Manage local Windows notification settings");

  notifications
    .command("enable")
    .description("Enable local Windows notifications")
    .option("--config <path>", "explicit config path")
    .option("--success", "also notify on successful sync/backfill")
    .option("--failure-only", "enable failure notifications but leave success notifications disabled")
    .action((options: ConfigNotificationOptions) =>
      runConfigNotificationsEnable(options, deps)
    );

  notifications
    .command("disable")
    .description("Disable local Windows notifications")
    .option("--config <path>", "explicit config path")
    .action((options: ConfigNotificationOptions) =>
      runConfigNotificationsDisable(options, deps)
    );

  notifications
    .command("status")
    .description("Print local notification settings")
    .option("--config <path>", "explicit config path")
    .action((options: ConfigNotificationOptions) =>
      runConfigNotificationsStatus(options, deps)
    );

  return command;
}
