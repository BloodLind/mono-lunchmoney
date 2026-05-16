const CURRENCY_CODES = new Map<number, string>([
  [980, "uah"],
  [840, "usd"],
  [978, "eur"],
  [985, "pln"],
  [826, "gbp"],
  [203, "czk"]
]);

export function currencyCodeToIso(code: number | undefined): string {
  if (code === undefined) {
    return "uah";
  }
  return CURRENCY_CODES.get(code) ?? String(code);
}
