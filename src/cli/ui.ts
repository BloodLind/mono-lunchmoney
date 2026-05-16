import { createCliStyle, shouldUseColor, stripAnsi, type CliStyle } from "./color.js";

export type CommandUi = ReturnType<typeof createCommandUi>;

export type KeyValue = {
  label: string;
  value: string | number | boolean | undefined;
  tone?: "normal" | "success" | "warning" | "danger" | "muted";
};

export function createCommandUi(env: NodeJS.ProcessEnv = process.env) {
  const style = createCliStyle(shouldUseColor(env));

  return {
    style,
    title(text: string): string {
      return `${style.title(text)}\n${style.muted("=".repeat(stripAnsi(text).length))}`;
    },
    section(text: string): string {
      return style.section(text);
    },
    muted(text: string): string {
      return style.muted(text);
    },
    success(text: string): string {
      return style.success(text);
    },
    warning(text: string): string {
      return style.warning(text);
    },
    command(text: string): string {
      return style.command(text);
    },
    value(text: string): string {
      return style.value(text);
    },
    bullet(text: string): string {
      return `  ${style.muted("-")} ${text}`;
    },
    choice(index: number, text: string, detail?: string): string {
      const number = style.value(String(index).padStart(2, " "));
      return `  ${number}. ${text}${detail ? `  ${style.muted(detail)}` : ""}`;
    },
    keyValues(items: KeyValue[]): string[] {
      const width = Math.max(...items.map((item) => stripAnsi(item.label).length), 0);
      return items.map((item) => {
        const label = `${item.label}:`.padEnd(width + 2, " ");
        return `  ${style.muted(label)}${colorValue(style, item.value, item.tone)}`;
      });
    }
  };
}

function colorValue(
  style: CliStyle,
  value: string | number | boolean | undefined,
  tone: KeyValue["tone"] = "normal"
): string {
  const text = value === undefined ? "-" : String(value);
  switch (tone) {
    case "success":
      return style.success(text);
    case "warning":
      return style.warning(text);
    case "danger":
      return style.danger(text);
    case "muted":
      return style.muted(text);
    case "normal":
      return style.value(text);
  }
}
