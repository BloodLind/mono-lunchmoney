import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { isCliEntrypoint } from "../../../src/cli.js";

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
