import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("notification follow-up documentation", () => {
  it("documents the supported notification scope", () => {
    const readme = readFileSync("README.md", "utf8");
    const quickstart = readFileSync("specs/001-node-cli-init/quickstart.md", "utf8");

    expect(readme).toMatch(/Windows desktop notifications/i);
    expect(readme).toMatch(/Email, mobile push, and non-Windows desktop notifications are not implemented/i);
    expect(quickstart).toMatch(/No desktop\/email\/push notification is expected for this missing-config check/i);
  });
});
