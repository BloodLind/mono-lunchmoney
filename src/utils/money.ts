const MINOR_UNITS = new Map<string, number>([
  ["uah", 2],
  ["usd", 2],
  ["eur", 2],
  ["pln", 2],
  ["gbp", 2],
  ["czk", 2],
  ["jpy", 0]
]);

export function minorUnitsToDecimalString(amountMinor: number, currency: string): string {
  const scale = MINOR_UNITS.get(currency.toLowerCase()) ?? 2;
  const sign = amountMinor < 0 ? "-" : "";
  const absolute = Math.abs(amountMinor);

  if (scale === 0) {
    return `${sign}${absolute}`;
  }

  const factor = 10 ** scale;
  const major = Math.floor(absolute / factor);
  const minor = String(absolute % factor).padStart(scale, "0");
  return `${sign}${major}.${minor}`;
}
