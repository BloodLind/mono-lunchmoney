import { Command } from "commander";
import { createCliStyle, shouldUseColor, type CliStyle } from "../cli/color.js";
import {
  DEFAULT_DAILY_AT,
  DEFAULT_TAG,
  DEFAULT_TASK_NAME,
  EXIT_CODES
} from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";

export type HelpDeps = {
  env?: NodeJS.ProcessEnv;
  stdout?: Pick<NodeJS.WriteStream, "write">;
};

const topics = ["setup", "sync", "scheduler", "config", "backfill", "security"] as const;

export type HelpFormatOptions = {
  color?: boolean;
  env?: NodeJS.ProcessEnv;
};

function formatLines(lines: string[]): string {
  return `${lines.join("\n")}\n`;
}

function createHelpStyle(options: HelpFormatOptions = {}): CliStyle {
  return createCliStyle(options.color ?? shouldUseColor(options.env));
}

function bullet(style: CliStyle, text: string): string {
  return `  ${style.muted("-")} ${text}`;
}

function command(style: CliStyle, value: string): string {
  return `  ${style.command(value)}`;
}

function formatOverviewHelp(style: CliStyle): string {
  return formatLines([
    style.title("Mono Lunch Money"),
    style.muted("================"),
    "",
    "Local, Windows-friendly Monobank -> Lunch Money transaction sync.",
    "",
    style.section("What it optimizes for"),
    bullet(style, "No hosted server."),
    bullet(style, "No local transaction database."),
    bullet(style, `Idempotent imports through ${style.value("Lunch Money external_id")}.`),
    bullet(style, "Daily background sync through Windows Task Scheduler."),
    bullet(style, "API tokens stay out of CLI arguments, config display, and logs."),
    "",
    style.section("Current implementation status"),
    bullet(
      style,
      "CLI package, command routing, config paths, scheduler shell, and failure logs are implemented."
    ),
    bullet(style, "setup, sync import, and backfill import are command shells for the next feature slice."),
    "",
    style.section("Core commands"),
    command(style, "mono-lunchmoney setup"),
    "      Interactive account selection and Lunch Money mapping. Not implemented yet.",
    "",
    command(style, 'mono-lunchmoney sync --config "%APPDATA%\\mono-lunchmoney\\config.json" --quiet'),
    "      Non-interactive background import command. Safe target for scheduled jobs.",
    "",
    command(style, `mono-lunchmoney scheduler install --daily-at ${DEFAULT_DAILY_AT}`),
    `      Create the ${DEFAULT_TASK_NAME} Windows scheduled task.`,
    "",
    command(style, "mono-lunchmoney scheduler status"),
    "      Show whether the scheduled task exists and its last/next run details.",
    "",
    command(style, "mono-lunchmoney config show"),
    "      Print sanitized config and runtime file locations.",
    "",
    command(style, "mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15"),
    "      Historical import shell for later implementation.",
    "",
    style.section("Help topics"),
    command(style, "mono-lunchmoney help setup"),
    command(style, "mono-lunchmoney help sync"),
    command(style, "mono-lunchmoney help scheduler"),
    command(style, "mono-lunchmoney help config"),
    command(style, "mono-lunchmoney help backfill"),
    command(style, "mono-lunchmoney help security"),
    "",
    style.section("Normal first-run shape"),
    command(style, 'setx MONO_TOKEN "..."'),
    command(style, 'setx LUNCHMONEY_TOKEN "..."'),
    command(style, "mono-lunchmoney setup"),
    command(style, "mono-lunchmoney sync"),
    command(style, `mono-lunchmoney scheduler install --daily-at ${DEFAULT_DAILY_AT}`)
  ]);
}

function formatSetupHelp(style: CliStyle): string {
  return formatLines([
    style.title("setup"),
    style.muted("====="),
    "",
    style.section("Purpose"),
    "  Fetch Monobank accounts/cards, choose what to track, map each source to a Lunch Money",
    "  manually-managed account, then save local config.",
    "",
    style.section("Command"),
    command(style, "mono-lunchmoney setup"),
    command(style, "mono-lunchmoney setup --reconfigure"),
    "",
    style.section("Expected future flow"),
    "  1. Read MONO_TOKEN and LUNCHMONEY_TOKEN from the user environment.",
    "  2. Validate both API connections.",
    "  3. Show masked Monobank account/card details.",
    "  4. Map each tracked source to an existing or new Lunch Money asset.",
    `  5. Save config with default tag "${DEFAULT_TAG}" and no plain API tokens.`,
    "",
    style.section("Current status"),
    "  The command is registered and discoverable, but the interactive mapping flow is not",
    "  implemented in this initialization slice."
  ]);
}

function formatSyncHelp(style: CliStyle): string {
  return formatLines([
    style.title("sync"),
    style.muted("===="),
    "",
    style.section("Purpose"),
    "  Non-interactive background import command for recent Monobank transactions.",
    "",
    style.section("Command"),
    command(style, "mono-lunchmoney sync"),
    command(style, "mono-lunchmoney sync --quiet"),
    command(style, 'mono-lunchmoney sync --config "C:\\path\\config.json" --quiet'),
    command(style, "mono-lunchmoney sync --dry-run --lookback-days 31"),
    "",
    style.section("Background behavior"),
    bullet(style, "Designed for Windows Task Scheduler."),
    bullet(style, "Returns non-zero on failure."),
    bullet(style, "Writes sanitized failures to error.log."),
    bullet(style, "Does not prompt for input."),
    "",
    style.section("Import rules for the sync feature"),
    bullet(style, "Import into configured Lunch Money asset_id."),
    bullet(style, "Set status to uncleared."),
    bullet(style, `Attach the configured tag, default "${DEFAULT_TAG}".`),
    bullet(style, "Use deterministic external_id values for duplicate prevention."),
    bullet(style, "Do not store local transaction cursors or imported transaction state."),
    "",
    style.section("Current status"),
    "  Missing-config handling and background failure logging are implemented. Real Monobank",
    "  and Lunch Money import work belongs to the next feature slice."
  ]);
}

function formatSchedulerHelp(style: CliStyle): string {
  return formatLines([
    style.title("scheduler"),
    style.muted("========="),
    "",
    style.section("Purpose"),
    "  Manage the daily Windows Task Scheduler job that runs quiet sync.",
    "",
    style.section("Commands"),
    command(style, `mono-lunchmoney scheduler install --daily-at ${DEFAULT_DAILY_AT}`),
    command(
      style,
      'mono-lunchmoney scheduler install --daily-at 20:00 --config "%APPDATA%\\mono-lunchmoney\\config.json"'
    ),
    command(style, "mono-lunchmoney scheduler status"),
    command(style, "mono-lunchmoney scheduler uninstall"),
    "",
    style.section("Task defaults"),
    `  Task name: ${DEFAULT_TASK_NAME}`,
    `  Daily time: ${DEFAULT_DAILY_AT}`,
    "  Command: mono-lunchmoney sync --config \"<configPath>\" --quiet",
    "",
    style.section("Safety rules"),
    bullet(style, "API tokens are never placed in the scheduled command."),
    bullet(style, "Missing task status exits successfully and reports Task exists: no."),
    bullet(style, "Install/uninstall require Windows Task Scheduler access.")
  ]);
}

function formatConfigHelp(style: CliStyle): string {
  return formatLines([
    style.title("config"),
    style.muted("======"),
    "",
    style.section("Purpose"),
    "  Inspect runtime paths and sanitized saved settings.",
    "",
    style.section("Command"),
    command(style, "mono-lunchmoney config show"),
    command(style, 'mono-lunchmoney config show --config "C:\\path\\config.json"'),
    "",
    style.section("Default Windows files"),
    "  %APPDATA%\\mono-lunchmoney\\config.json",
    "  %APPDATA%\\mono-lunchmoney\\sync.log",
    "  %APPDATA%\\mono-lunchmoney\\error.log",
    "  %APPDATA%\\mono-lunchmoney\\sync.lock",
    "",
    style.section("Rules"),
    bullet(style, "Does not create imported transaction state."),
    bullet(style, "Does not print API token values."),
    bullet(style, "Masks sensitive financial identifiers in displayed config.")
  ]);
}

function formatBackfillHelp(style: CliStyle): string {
  return formatLines([
    style.title("backfill"),
    style.muted("========"),
    "",
    style.section("Purpose"),
    "  Import historical Monobank transactions over explicit date ranges.",
    "",
    style.section("Command"),
    command(style, "mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15"),
    command(
      style,
      'mono-lunchmoney backfill --from 2026-01-01 --to 2026-05-15 --config "C:\\path\\config.json"'
    ),
    "",
    style.section("Expected future behavior"),
    bullet(style, "Split date ranges into Monobank-compatible windows."),
    bullet(style, "Reuse the same mapping, notes, tags, and external_id rules as sync."),
    bullet(style, "Stay safe to rerun through Lunch Money duplicate prevention."),
    "",
    style.section("Current status"),
    "  The command shell and date options are registered. Historical import is not implemented",
    "  in this initialization slice."
  ]);
}

function formatSecurityHelp(style: CliStyle): string {
  return formatLines([
    style.title("security"),
    style.muted("========"),
    "",
    style.section("Rules this CLI is built around"),
    bullet(style, "Do not pass API tokens as command-line arguments."),
    bullet(style, "Do not store plain API tokens in config.json by default."),
    bullet(style, "Do not log API token values."),
    bullet(style, "Do not log full card numbers or full IBANs."),
    bullet(style, "Keep config under the current user's profile."),
    bullet(style, "Store only static or semi-static config, never imported transaction state."),
    "",
    style.section("Recommended token sources"),
    command(style, 'setx MONO_TOKEN "..."'),
    command(style, 'setx LUNCHMONEY_TOKEN "..."'),
    "",
    style.section("Background failure visibility"),
    bullet(style, "Check mono-lunchmoney scheduler status for task state."),
    bullet(style, "Check %APPDATA%\\mono-lunchmoney\\error.log for sanitized failure records."),
    bullet(style, "Desktop/email/push notifications are intentionally a separate follow-up feature.")
  ]);
}

export function formatDetailedHelp(topic?: string, options: HelpFormatOptions = {}): string {
  const normalized = topic?.toLowerCase();
  const style = createHelpStyle(options);
  if (!normalized || normalized === "overview" || normalized === "all") {
    return formatOverviewHelp(style);
  }

  switch (normalized) {
    case "setup":
      return formatSetupHelp(style);
    case "sync":
      return formatSyncHelp(style);
    case "scheduler":
    case "schedule":
      return formatSchedulerHelp(style);
    case "config":
    case "configuration":
      return formatConfigHelp(style);
    case "backfill":
      return formatBackfillHelp(style);
    case "security":
    case "tokens":
      return formatSecurityHelp(style);
    default:
      throw new CliError(
        `Unknown help topic: ${topic}. Available topics: ${topics.join(", ")}.`,
        EXIT_CODES.USER_ERROR
      );
  }
}

export function createHelpCommand(deps: HelpDeps = {}): Command {
  return new Command("help")
    .description("Show detailed command guide and workflows")
    .argument("[topic]", "setup, sync, scheduler, config, backfill, or security")
    .action((topic?: string) => {
      deps.stdout?.write(formatDetailedHelp(topic, { env: deps.env }));
    });
}
