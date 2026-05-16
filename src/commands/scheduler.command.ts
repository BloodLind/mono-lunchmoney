import { Command } from "commander";
import { DEFAULT_DAILY_AT, DEFAULT_TASK_NAME } from "../cli/command-registry.js";
import { createCommandUi } from "../cli/ui.js";
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
      const ui = createCommandUi(deps.env);
      const parsed = schedulerInstallOptionsSchema.parse(options);
      const paths = resolveRuntimePaths({ configPath: parsed.config, env: deps.env });
      const scheduled = await installScheduledTask({
        dailyAt: parsed.dailyAt,
        taskName: parsed.taskName,
        configPath: paths.configPath,
        appDataDirectory: paths.appDataDirectory,
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
      writeLine(deps, ui.title("Scheduler Installed"));
      writeLine(deps, "");
      for (const line of ui.keyValues([
        { label: "Task name", value: parsed.taskName, tone: "success" },
        { label: "Daily at", value: parsed.dailyAt },
        { label: "Command", value: scheduled.commandLine },
        { label: "Mode", value: "hidden background", tone: "success" }
      ])) {
        writeLine(deps, line);
      }
    });

  command
    .command("status")
    .description("Show background sync task status")
    .option("--task-name <name>", "Windows task name", DEFAULT_TASK_NAME)
    .action(async (options: { taskName: string }) => {
      const ui = createCommandUi(deps.env);
      const status = await getScheduledTaskStatus(options.taskName, deps.executor);
      writeLine(deps, ui.title("Scheduler Status"));
      writeLine(deps, "");
      for (const line of ui.keyValues([
        {
          label: "Task exists",
          value: status.exists ? "yes" : "no",
          tone: status.exists ? "success" : "warning"
        },
        { label: "Task name", value: status.taskName },
        { label: "Next run time", value: status.nextRunTime, tone: status.nextRunTime ? "normal" : "muted" },
        { label: "Last run time", value: status.lastRunTime, tone: status.lastRunTime ? "normal" : "muted" },
        {
          label: "Last result code",
          value: status.lastResultCode,
          tone: status.lastResultCode === 0 ? "success" : status.lastResultCode === undefined ? "muted" : "warning"
        },
        { label: "Command", value: status.registeredCommand, tone: status.registeredCommand ? "normal" : "muted" },
        { label: "Mode", value: status.mode, tone: status.mode ? "success" : "muted" }
      ])) {
        writeLine(deps, line);
      }
    });

  command
    .command("uninstall")
    .description("Remove background sync task")
    .option("--task-name <name>", "Windows task name", DEFAULT_TASK_NAME)
    .action(async (options: { taskName: string }) => {
      const ui = createCommandUi(deps.env);
      await uninstallScheduledTask(options.taskName, deps.executor);
      writeLine(deps, ui.title("Scheduler Removed"));
      writeLine(deps, "");
      for (const line of ui.keyValues([{ label: "Task name", value: options.taskName, tone: "success" }])) {
        writeLine(deps, line);
      }
    });

  return command;
}
