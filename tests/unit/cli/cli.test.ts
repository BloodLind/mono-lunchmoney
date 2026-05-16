import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { stripAnsi } from "../../../src/cli/color.js";
import { APP_VERSION, COMMAND_NAMES } from "../../../src/cli/command-registry.js";
import { createCliProgram, isCliEntrypoint } from "../../../src/cli.js";
import { runConfigShow } from "../../../src/commands/config.command.js";
import { formatDetailedHelp } from "../../../src/commands/help.command.js";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  bin: Record<string, string>;
  engines: Record<string, string>;
  files: string[];
};

describe("CLI command surface", () => {
  it("registers the required command groups", () => {
    const registered = createCliProgram().commands.map((command) => command.name());

    expect(registered.sort()).toEqual([...COMMAND_NAMES].sort());
  });

  it("uses explicit config path in config show output", () => {
    let output = "";
    runConfigShow(
      { config: "D:\\custom\\config.json" },
      {
        env: { APPDATA: "C:\\Users\\Ada\\AppData\\Roaming" },
        stdout: { write: (chunk: string) => (output += chunk) }
      }
    );

    const plain = stripAnsi(output);
    expect(plain).toContain("D:\\custom\\config.json");
    expect(plain).toMatch(/Config exists:\s+no/);
  });

  it("exposes mono-lunchmoney as an installable command", () => {
    expect(pkg.bin["mono-lunchmoney"]).toBe("./dist/cli.js");
    expect(pkg.engines.node).toBeDefined();
    expect(pkg.files).toContain("dist/");
  });
});

describe("CLI entrypoint detection", () => {
  it("matches equivalent relative and absolute paths", () => {
    const absolute = join(process.cwd(), "dist", "cli.js");
    const relative = join(".", "dist", "cli.js");

    expect(isCliEntrypoint(pathToFileURL(absolute).href, relative)).toBe(true);
  });

  it("rejects unrelated entrypoints", () => {
    const absolute = join(process.cwd(), "dist", "cli.js");

    expect(isCliEntrypoint(pathToFileURL(absolute).href, join(".", "dist", "other.js"))).toBe(
      false
    );
  });
});

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
