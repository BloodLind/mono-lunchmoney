import { describe, expect, it } from "vitest";
import { APP_VERSION } from "../../../src/cli/command-registry.js";
import { createCliProgram } from "../../../src/cli.js";
import { formatDetailedHelp } from "../../../src/commands/help.command.js";
import { stripAnsi } from "../../../src/cli/color.js";

describe("CLI help and version", () => {
  it("prints top-level command discovery without credentials", () => {
    const help = stripAnsi(createCliProgram().helpInformation());

    expect(help).toContain("setup");
    expect(help).toContain("sync");
    expect(help).toContain("backfill");
    expect(help).toContain("scheduler");
    expect(help).toContain("config");
    expect(help).toContain("help [topic]");
    expect(help).toContain("Show detailed command guide");
    expect(help).not.toMatch(/token/i);
  });

  it("prints a useful detailed help page", () => {
    const help = stripAnsi(formatDetailedHelp(undefined, { color: false }));

    expect(help).toContain("Mono Lunch Money");
    expect(help).toContain("No local transaction database");
    expect(help).toContain("mono-lunchmoney scheduler install");
    expect(help).toContain("mono-lunchmoney help security");
  });

  it("prints focused command help by topic", () => {
    const syncHelp = stripAnsi(formatDetailedHelp("sync", { color: false }));

    expect(syncHelp).toContain("sync");
    expect(syncHelp).toContain("Non-interactive background import command");
    expect(syncHelp).toContain("Current status");
  });

  it("uses the package version constant", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("uses ANSI color in detailed help by default", () => {
    expect(formatDetailedHelp()).toContain(`${String.fromCharCode(27)}[`);
  });
});
