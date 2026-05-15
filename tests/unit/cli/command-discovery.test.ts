import { describe, expect, it } from "vitest";
import { COMMAND_NAMES } from "../../../src/cli/command-registry.js";
import { createCliProgram } from "../../../src/cli.js";

describe("command discovery", () => {
  it("registers the required command groups", () => {
    const registered = createCliProgram().commands.map((command) => command.name());

    expect(registered.sort()).toEqual([...COMMAND_NAMES].sort());
  });
});
