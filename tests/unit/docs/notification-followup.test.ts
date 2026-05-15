import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("notification follow-up documentation", () => {
  it("keeps active background notifications explicitly out of this feature", () => {
    const readme = readFileSync("README.md", "utf8");
    const quickstart = readFileSync("specs/001-node-cli-init/quickstart.md", "utf8");

    expect(readme).toMatch(/separate follow-up feature/i);
    expect(quickstart).toMatch(/No active desktop\/email\/push notification is expected/i);
  });
});
