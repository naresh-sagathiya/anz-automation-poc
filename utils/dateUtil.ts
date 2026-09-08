export function rollToBusinessDay(date: string, holidays: readonly string[] = []): string {
  const candidate = parseDateOnly(date);
  const holidaySet = new Set(holidays);

  while (isWeekend(candidate) || holidaySet.has(formatDateOnly(candidate))) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }

  return formatDateOnly(candidate);
}

export function formatDateInAest(date: Date): string {
  return formatDateInTimeZone(date, 'Australia/Sydney');
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getTodayInAest(): string {
  return getTodayInTimeZone('Australia/Sydney');
}

export function getTodayInTimeZone(timeZone: string): string {
  return formatDateInTimeZone(new Date(), timeZone);
}

export function addDays(date: string, days: number): string {
  const result = parseDateOnly(date);
  result.setUTCDate(result.getUTCDate() + days);
  return formatDateOnly(result);
}

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || formatDateOnly(date) !== value) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}