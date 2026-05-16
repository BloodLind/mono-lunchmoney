import { describe, expect, it } from "vitest";
import { WindowsNotifier } from "../../../src/notifications/windows-notifier.js";

describe("Windows notifier", () => {
  it("skips unsupported platforms", async () => {
    const notifier = new WindowsNotifier({ platform: "linux", executor: async () => "" });

    expect(notifier.isSupported()).toBe(false);
    await expect(
      notifier.notify({ title: "Title", body: "Body", severity: "info" })
    ).resolves.toEqual({ status: "skipped", reason: "unsupported-platform" });
  });

  it("requests a notification through the injected executor on Windows", async () => {
    let script = "";
    const notifier = new WindowsNotifier({
      platform: "win32",
      executor: async (value) => {
        script = value;
        return "";
      }
    });

    await expect(
      notifier.notify({
        title: "Title MONO_TOKEN=secret",
        body: "Card 4444333322221111",
        severity: "error"
      })
    ).resolves.toEqual({ status: "delivered" });

    expect(script).toContain("New-BurntToastNotification");
    expect(script).not.toContain("secret");
    expect(script).not.toContain("4444333322221111");
  });

  it("returns failed when the executor fails", async () => {
    const notifier = new WindowsNotifier({
      platform: "win32",
      executor: async () => {
        throw new Error("bad token secret");
      }
    });

    const result = await notifier.notify({ title: "Title", body: "Body", severity: "warning" });

    expect(result.status).toBe("failed");
    expect(result.reason).not.toContain("secret");
  });
});
