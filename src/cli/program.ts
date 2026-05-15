import { Command } from "commander";
import { createCliStyle, shouldUseColor, stripAnsi } from "./color.js";
import { APP_NAME, APP_VERSION } from "./command-registry.js";

export function createProgram(): Command {
  const style = createCliStyle(shouldUseColor());

  return new Command()
    .name(APP_NAME)
    .description("Local Monobank to Lunch Money bridge")
    .option("--config <path>", "explicit config path for commands that support config")
    .version(APP_VERSION)
    .addHelpCommand(false)
    .configureOutput({
      getOutHasColors: () => shouldUseColor(),
      getErrHasColors: () => shouldUseColor(),
      stripColor: stripAnsi
    })
    .configureHelp({
      styleTitle: style.section,
      styleUsage: style.command,
      styleCommandText: style.command,
      styleCommandDescription: style.muted,
      styleSubcommandText: style.command,
      styleSubcommandTerm: style.command,
      styleSubcommandDescription: style.muted,
      styleOptionText: style.option,
      styleOptionTerm: style.option,
      styleOptionDescription: style.muted,
      styleArgumentText: style.value,
      styleArgumentTerm: style.value,
      styleArgumentDescription: style.muted
    })
    .showHelpAfterError()
    .showSuggestionAfterError();
}
