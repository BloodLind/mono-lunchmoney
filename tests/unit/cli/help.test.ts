import { describe, expect, it } from "vitest";
import { APP_VERSION } from "../../../src/cli/command-registry.js";
import { createCliProgram } from "../../../src/cli.js";
import { formatDetailedHelp } from "../../../src/commands/help.command.js";
import { stripAnsi } from "../../../src/cli/color.js";

describe("CLI help and version", () => {
  it("prints top-level command discovery without token values", () => {
    const help = stripAnsi(createCliProgram().helpInformation());

    expect(help).toContain("setup");
    expect(help).toContain("sync");
    expect(help).toContain("backfill");
    expect(help).toContain("scheduler");
    expect(help).toContain("config");
    expect(help).toContain("credentials");
    expect(help).toContain("help [topic]");
    expect(help).toContain("Show detailed command guide");
    expect(help).not.toContain("MONO_TOKEN");
    expect(help).not.toContain("LUNCHMONEY_TOKEN");
  });

  it("prints a useful detailed help page", () => {
    const help = stripAnsi(formatDetailedHelp(undefined, { color: false }));

    expect(help).toContain("Mono Lunch Money");
    expect(help).toContain("No local transaction database");
    expect(help).toContain("Interactive setup maps Monobank sources");
    expect(help).toContain("mono-lunchmoney scheduler install");
    expect(help).toContain("mono-lunchmoney help security");
    expect(help).not.toMatch(/not implemented yet|command shells|next feature slice/i);
  });

  it("prints focused command help by topic", () => {
    const syncHelp = stripAnsi(formatDetailedHelp("sync", { color: false }));
    const setupHelp = stripAnsi(formatDetailedHelp("setup", { color: false }));
    const backfillHelp = stripAnsi(formatDetailedHelp("backfill", { color: false }));
    const credentialsHelp = stripAnsi(formatDetailedHelp("credentials", { color: false }));

    expect(syncHelp).toContain("sync");
    expect(syncHelp).toContain("Non-interactive background import command");
    expect(syncHelp).toContain("Operational behavior");
    expect(setupHelp).toContain("Map each tracked source to an existing or new Lunch Money asset");
    expect(backfillHelp).toContain("Split date ranges into Monobank-compatible windows");
    expect(credentialsHelp).toContain("Manage reusable Monobank and Lunch Money API tokens");
    expect(`${setupHelp}\n${syncHelp}\n${backfillHelp}\n${credentialsHelp}`).not.toMatch(
      /interactive mapping flow is not|not implemented|future behavior|command shell/i
    );
  });

  it("uses the package version constant", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("uses ANSI color in detailed help by default", () => {
    expect(formatDetailedHelp()).toContain(`${String.fromCharCode(27)}[`);
  });
});
