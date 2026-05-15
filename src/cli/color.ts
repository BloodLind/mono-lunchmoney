const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-?]*[ -/]*[@-~]`, "g");

const codes = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[38;2;75;208;255m",
  blue: "\x1b[38;2;101;154;255m",
  green: "\x1b[38;2;63;220;151m",
  magenta: "\x1b[38;2;210;124;255m",
  yellow: "\x1b[38;2;255;211;105m",
  red: "\x1b[38;2;255;111;111m",
  gray: "\x1b[38;2;142;150;170m"
} as const;

export type CliStyle = ReturnType<typeof createCliStyle>;

export function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, "");
}

export function shouldUseColor(env: NodeJS.ProcessEnv = process.env): boolean {
  if ("NO_COLOR" in env || env.MONO_LUNCHMONEY_NO_COLOR === "1" || env.FORCE_COLOR === "0") {
    return false;
  }
  return true;
}

function wrap(enabled: boolean, open: string, value: string): string {
  return enabled ? `${open}${value}${codes.reset}` : value;
}

export function createCliStyle(enabled = shouldUseColor()) {
  const pair = (open: string) => (value: string) => wrap(enabled, open, value);

  return {
    title: pair(`${codes.bold}${codes.cyan}`),
    section: pair(`${codes.bold}${codes.magenta}`),
    command: pair(codes.green),
    option: pair(codes.yellow),
    value: pair(codes.blue),
    success: pair(codes.green),
    warning: pair(codes.yellow),
    danger: pair(codes.red),
    muted: pair(codes.gray),
    dim: pair(codes.dim),
    bold: pair(codes.bold)
  };
}
