import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  DEFAULT_DAILY_AT,
  DEFAULT_TASK_NAME,
  EXIT_CODES
} from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { hhmmSchema } from "../config/config.model.js";
import { hasTokenLikeArgument, sanitizeText } from "../utils/masking.js";

const execFileAsync = promisify(execFile);

export type ScheduledCommand = {
  execute: string;
  arguments: string[];
  commandLine: string;
};

export type SchedulerStatus = {
  exists: boolean;
  taskName: string;
  nextRunTime?: string;
  lastRunTime?: string;
  lastResultCode?: number;
  registeredCommand?: string;
};

export type SchedulerCommandInput = {
  cliCommand?: string;
  configPath: string;
};

export type SchedulerOptions = {
  taskName?: string;
  dailyAt?: string;
  configPath: string;
  executor?: PowerShellExecutor;
};

export type PowerShellExecutor = (script: string) => Promise<string>;

function quoteArg(value: string): string {
  if (!/[\s"]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '\\"')}"`;
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function buildScheduledSyncCommand(input: SchedulerCommandInput): ScheduledCommand {
  const execute = input.cliCommand ?? "mono-lunchmoney";
  const args = ["sync", "--config", input.configPath, "--quiet"];

  if (hasTokenLikeArgument([execute, ...args])) {
    throw new CliError("Scheduled command must not contain token arguments.", EXIT_CODES.USER_ERROR);
  }

  return {
    execute,
    arguments: args,
    commandLine: [execute, ...args.map(quoteArg)].join(" ")
  };
}

export function parseSchedulerStatus(raw: string, taskName = DEFAULT_TASK_NAME): SchedulerStatus {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "null") {
    return { exists: false, taskName };
  }

  const parsed = JSON.parse(trimmed) as {
    TaskName?: string;
    NextRunTime?: string;
    LastRunTime?: string;
    LastTaskResult?: number;
    Execute?: string;
    Arguments?: string;
  };

  const execute = parsed.Execute ?? "";
  const args = parsed.Arguments ?? "";
  const command = [execute, args].filter(Boolean).join(" ");

  return {
    exists: true,
    taskName: parsed.TaskName ?? taskName,
    nextRunTime: parsed.NextRunTime,
    lastRunTime: parsed.LastRunTime,
    lastResultCode: parsed.LastTaskResult,
    registeredCommand: command ? sanitizeText(command) : undefined
  };
}

export async function defaultPowerShellExecutor(script: string): Promise<string> {
  const executable = process.env.ComSpec ? "powershell.exe" : "pwsh";
  const { stdout } = await execFileAsync(executable, [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script
  ]);
  return stdout;
}

function assertWindows(): void {
  if (process.platform !== "win32") {
    throw new CliError("Windows Task Scheduler is only available on Windows.", EXIT_CODES.EXTERNAL_ERROR);
  }
}

export async function installScheduledTask(options: SchedulerOptions): Promise<ScheduledCommand> {
  assertWindows();
  const dailyAt = hhmmSchema.parse(options.dailyAt ?? DEFAULT_DAILY_AT);
  const taskName = options.taskName ?? DEFAULT_TASK_NAME;
  const scheduled = buildScheduledSyncCommand({ configPath: options.configPath });
  const argument = scheduled.arguments.map(quoteArg).join(" ");
  const executor = options.executor ?? defaultPowerShellExecutor;
  const script = [
    `$Action = New-ScheduledTaskAction -Execute ${psQuote(scheduled.execute)} -Argument ${psQuote(
      argument
    )}`,
    `$Trigger = New-ScheduledTaskTrigger -Daily -At ${psQuote(dailyAt)}`,
    "$Settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries",
    `Register-ScheduledTask -TaskName ${psQuote(taskName)} -Action $Action -Trigger $Trigger -Settings $Settings -Description ${psQuote(
      "Daily Monobank to Lunch Money transaction sync"
    )} -Force | Out-Null`
  ].join("; ");

  await executor(script);
  return scheduled;
}

export async function getScheduledTaskStatus(
  taskName = DEFAULT_TASK_NAME,
  executor: PowerShellExecutor = defaultPowerShellExecutor
): Promise<SchedulerStatus> {
  if (process.platform !== "win32") {
    return { exists: false, taskName };
  }

  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$Task = $null`,
    `try { $Task = Get-ScheduledTask -TaskName ${psQuote(taskName)} -ErrorAction Stop } catch { exit 0 }`,
    "if ($null -eq $Task) { exit 0 }",
    "$Info = Get-ScheduledTaskInfo -TaskName $Task.TaskName",
    "$Action = @($Task.Actions)[0]",
    "[PSCustomObject]@{ TaskName = $Task.TaskName; NextRunTime = $Info.NextRunTime; LastRunTime = $Info.LastRunTime; LastTaskResult = $Info.LastTaskResult; Execute = $Action.Execute; Arguments = $Action.Arguments } | ConvertTo-Json -Compress"
  ].join("; ");

  const stdout = await executor(script);
  return parseSchedulerStatus(stdout, taskName);
}

export async function uninstallScheduledTask(
  taskName = DEFAULT_TASK_NAME,
  executor: PowerShellExecutor = defaultPowerShellExecutor
): Promise<void> {
  assertWindows();
  const script = [
    `$Task = Get-ScheduledTask -TaskName ${psQuote(taskName)} -ErrorAction SilentlyContinue`,
    "if ($null -ne $Task) { Unregister-ScheduledTask -TaskName $Task.TaskName -Confirm:$false }"
  ].join("; ");
  await executor(script);
}
