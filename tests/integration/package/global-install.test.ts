import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("global package install", () => {
  it("runs the generated global CLI shim", () => {
    mkdirSync(".tmp", { recursive: true });
    const prefix = mkdtempSync(join(process.cwd(), ".tmp", "global-install-"));
    const npmCommand = process.env.npm_execpath
      ? { executable: process.execPath, args: [process.env.npm_execpath] }
      : { executable: process.platform === "win32" ? "npm.cmd" : "npm", args: [] };

    try {
      const install = spawnSync(
        npmCommand.executable,
        [...npmCommand.args, "install", "--global", ".", "--prefix", prefix],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            NODE_OPTIONS: "",
            npm_config_cache: ".npm-cache",
            NPM_CONFIG_CACHE: ".npm-cache"
          }
        }
      );

      expect(install.status, install.error?.message || install.stderr || install.stdout).toBe(0);

      const shim =
        process.platform === "win32"
          ? join(prefix, "mono-lunchmoney.cmd")
          : join(prefix, "bin", "mono-lunchmoney");
      expect(existsSync(shim)).toBe(true);

      const help =
        process.platform === "win32"
          ? spawnSync(
              "powershell.exe",
              [
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                `& '${shim.replace(/'/g, "''")}' --help`
              ],
              {
                encoding: "utf8",
                env: { ...process.env, NODE_OPTIONS: "" }
              }
            )
          : spawnSync(shim, ["--help"], {
              encoding: "utf8",
              env: { ...process.env, NODE_OPTIONS: "" }
            });

      expect(help.status, help.stderr || help.stdout).toBe(0);
      expect(help.stdout).toContain("mono-lunchmoney");
      expect(help.stdout).toContain("credentials");
      expect(help.stdout).toContain("help [topic]");
    } finally {
      rmSync(prefix, { recursive: true, force: true });
    }
  });
});
