export function toLocalIsoDate(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  return formatDateOnly(date);
}

export function parseLocalDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date ${value}; expected YYYY-MM-DD.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatDateOnly(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseFlexibleLocalDate(value: string, now = new Date()): Date {
  const input = value.trim();
  if (!input) {
    throw new Error("Date value is required.");
  }

  const lower = input.toLowerCase();
  if (lower === "today") {
    return startOfLocalDay(now);
  }
  if (lower === "yesterday") {
    const date = startOfLocalDay(now);
    date.setDate(date.getDate() - 1);
    return date;
  }

  const strictYearFirst = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(input);
  if (strictYearFirst) {
    return validLocalDate(Number(strictYearFirst[1]), Number(strictYearFirst[2]), Number(strictYearFirst[3]));
  }

  const dottedDayFirst = /^(\d{1,2})[.](\d{1,2})[.](\d{4})$/.exec(input);
  if (dottedDayFirst) {
    return validLocalDate(Number(dottedDayFirst[3]), Number(dottedDayFirst[2]), Number(dottedDayFirst[1]));
  }

  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input);
  if (slashDate) {
    const first = Number(slashDate[1]);
    const second = Number(slashDate[2]);
    const year = Number(slashDate[3]);
    if (first > 12) {
      return validLocalDate(year, second, first);
    }
    if (second > 12) {
      return validLocalDate(year, first, second);
    }
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date ${value}.`);
  }
  return startOfLocalDay(parsed);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function validLocalDate(year: number, month: number, day: number): Date {
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error("Invalid calendar date.");
  }
  return date;
}
