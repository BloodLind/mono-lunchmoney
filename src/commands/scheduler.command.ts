import { Command } from "commander";
import { DEFAULT_DAILY_AT, DEFAULT_TASK_NAME } from "../cli/command-registry.js";
import { schedulerInstallOptionsSchema } from "../config/config.model.js";
import { loadConfig } from "../config/config.loader.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { writeConfig } from "../config/config.writer.js";
import {
  getScheduledTaskStatus,
  installScheduledTask,
  uninstallScheduledTask,
  type PowerShellExecutor
} from "../scheduler/windows-task-scheduler.js";

export type SchedulerDeps = {
  env?: NodeJS.ProcessEnv;
  stdout?: Pick<NodeJS.WriteStream, "write">;
  executor?: PowerShellExecutor;
};

function writeLine(deps: SchedulerDeps, text: string): void {
  deps.stdout?.write(`${text}\n`);
}

export function createSchedulerCommand(deps: SchedulerDeps = {}): Command {
  const command = new Command("scheduler").description("Manage Windows background sync task");

  command
    .command("install")
    .description("Install daily background sync task")
    .option("--daily-at <HH:mm>", "daily local run time", DEFAULT_DAILY_AT)
    .option("--config <path>", "explicit config path")
    .option("--task-name <name>", "Windows task name", DEFAULT_TASK_NAME)
    .action(async (options: { dailyAt: string; config?: string; taskName: string }) => {
      const parsed = schedulerInstallOptionsSchema.parse(options);
      const paths = resolveRuntimePaths({ configPath: parsed.config, env: deps.env });
      const scheduled = await installScheduledTask({
        dailyAt: parsed.dailyAt,
        taskName: parsed.taskName,
        configPath: paths.configPath,
        executor: deps.executor
      });
      const loaded = loadConfig(paths.configPath);
      if (loaded.exists) {
        await writeConfig(paths.configPath, {
          ...loaded.config,
          scheduler: {
            enabled: true,
            type: "windows-task-scheduler",
            dailyAt: parsed.dailyAt,
            taskName: parsed.taskName
          }
        });
      }
      writeLine(deps, `Task installed: ${parsed.taskName}`);
      writeLine(deps, `Command: ${scheduled.commandLine}`);
    });

  command
    .command("status")
    .description("Show background sync task status")
    .option("--task-name <name>", "Windows task name", DEFAULT_TASK_NAME)
    .action(async (options: { taskName: string }) => {
      const status = await getScheduledTaskStatus(options.taskName, deps.executor);
      writeLine(deps, `Task exists: ${status.exists ? "yes" : "no"}`);
      writeLine(deps, `Task name: ${status.taskName}`);
      if (status.nextRunTime) writeLine(deps, `Next run time: ${status.nextRunTime}`);
      if (status.lastRunTime) writeLine(deps, `Last run time: ${status.lastRunTime}`);
      if (status.lastResultCode !== undefined) {
        writeLine(deps, `Last result code: ${status.lastResultCode}`);
      }
      if (status.registeredCommand) writeLine(deps, `Command: ${status.registeredCommand}`);
    });

  command
    .command("uninstall")
    .description("Remove background sync task")
    .option("--task-name <name>", "Windows task name", DEFAULT_TASK_NAME)
    .action(async (options: { taskName: string }) => {
      await uninstallScheduledTask(options.taskName, deps.executor);
      writeLine(deps, `Task uninstalled: ${options.taskName}`);
    });

  return command;
}
