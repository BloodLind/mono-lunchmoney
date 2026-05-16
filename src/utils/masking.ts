import { createHash } from "node:crypto";

const TOKEN_KEY_PATTERN = /\b(?:MONO_TOKEN|LUNCHMONEY_TOKEN|X-Token|Authorization)\b/gi;
const TOKEN_OPTION_PATTERN = /^--(?:mono-|lunchmoney-)?token(?:=.*)?$/i;
const TOKENISH_OPTION_PATTERN = /^--.*token(?:=.*)?$/i;

export function hasTokenLikeArgument(args: readonly string[]): boolean {
  if (/(^|\s)--[\w-]*token(?:=|\s|$)/i.test(args.join(" "))) {
    return true;
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (TOKEN_OPTION_PATTERN.test(arg) || TOKENISH_OPTION_PATTERN.test(arg)) {
      return true;
    }
    if (/^(?:MONO_TOKEN|LUNCHMONEY_TOKEN)=/i.test(arg)) {
      return true;
    }
    if (/^(?:Bearer|X-Token)$/i.test(arg) && args[index + 1]) {
      return true;
    }
  }
  return false;
}

export function sanitizeText(value: unknown): string {
  let text = String(value);

  text = text.replace(/(--[\w-]*token(?:=|\s+))("[^"]+"|'[^']+'|\S+)/gi, "$1[REDACTED]");
  text = text.replace(/\b(MONO_TOKEN|LUNCHMONEY_TOKEN)=("[^"]+"|'[^']+'|\S+)/gi, "$1=[REDACTED]");
  text = text.replace(/\b(Bearer\s+)([A-Za-z0-9._~+/-]+=*)/gi, "$1[REDACTED]");
  text = text.replace(/\b(X-Token:\s*)([A-Za-z0-9._~+/-]+=*)/gi, "$1[REDACTED]");
  text = text.replace(
    /\b(token|secret|password|authorization)\s+("[^"]+"|'[^']+'|\S+)/gi,
    "$1 [REDACTED]"
  );
  text = text.replace(TOKEN_KEY_PATTERN, (match) => match);

  text = text.replace(/\b([A-Z]{2}\d{2}[A-Z0-9]{8,30})\b/g, (match) => {
    return maskIban(match);
  });

  text = text.replace(/\b(\d{12,19})\b/g, (match) => {
    return maskPan(match);
  });

  text = text.replace(/\b([a-z0-9_-]{20,})\b/gi, (match) => {
    if (/^[a-z0-9._~+/-]+=*$/i.test(match)) {
      return maskLongIdentifier(match);
    }
    return match;
  });

  return text;
}

export function sanitizeObject<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      if (/token|secret|password/i.test(key)) {
        return "[REDACTED]";
      }
      if (typeof item === "string") {
        return sanitizeText(item);
      }
      return item;
    })
  ) as T;
}

export function maskPan(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) {
    return value;
  }
  return `${digits.slice(0, 4)}...${digits.slice(-4)}`;
}

export function maskIban(value: string): string {
  if (value.length <= 8) {
    return value;
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function maskLongIdentifier(value: string): string {
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase(), "utf8").digest("hex");
}
