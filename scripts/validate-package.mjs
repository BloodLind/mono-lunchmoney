import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const forbidden = [/\.env/i, /config\.json/i, /sync\.log/i, /error\.log/i, /sync\.lock/i];
const tokenPattern = /(MONO_TOKEN|LUNCHMONEY_TOKEN|--mono-token|--lunchmoney-token)/i;

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

if (packageJson.bin?.["mono-lunchmoney"] !== "./dist/cli.js") {
  throw new Error("package.json must expose mono-lunchmoney -> ./dist/cli.js");
}

const scripts = JSON.stringify(packageJson.scripts ?? {});
if (tokenPattern.test(scripts)) {
  throw new Error("package scripts must not contain token arguments");
}

const packArgs = ["pack", "--dry-run", "--json", "--cache", ".npm-cache"];
const npmCommand = process.env.npm_execpath
  ? { executable: process.execPath, args: [process.env.npm_execpath, ...packArgs] }
  : { executable: process.platform === "win32" ? "npm.cmd" : "npm", args: packArgs };

const result = spawnSync(npmCommand.executable, npmCommand.args, {
  encoding: "utf8",
  env: {
    ...process.env,
    NODE_OPTIONS: "",
    npm_config_cache: ".npm-cache",
    NPM_CONFIG_CACHE: ".npm-cache"
  }
});

if (result.status !== 0) {
  throw new Error(
    `npm pack --dry-run failed: ${result.error?.message || result.stderr || result.stdout}`
  );
}

const payload = JSON.parse(result.stdout);
const files = payload[0]?.files?.map((file) => file.path) ?? [];
if (
  !files.includes("package.json") ||
  !files.includes("README.md") ||
  !files.includes("LICENSE") ||
  !files.includes("dist/cli.js")
) {
  throw new Error("package must include package.json, README.md, LICENSE, and dist/cli.js");
}

for (const file of files) {
  if (forbidden.some((pattern) => pattern.test(file))) {
    throw new Error(`package contains forbidden runtime file: ${file}`);
  }
}

console.log(`Package validation passed (${files.length} files checked).`);
