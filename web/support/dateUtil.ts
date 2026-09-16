/** Date helpers for web payment scheduling, business-day handling, and time zones. */
export function rollToBusinessDay(date: string, holidays: readonly string[] = []): string {
  const candidate = parseDateOnly(date);
  const holidaySet = new Set(holidays);

  while (isWeekend(candidate) || holidaySet.has(formatDateOnly(candidate))) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }

  return formatDateOnly(candidate);
}

/** Formats a date in the configured Australian Eastern time zone. */
export function formatDateInAest(date: Date): string {
  return formatDateInTimeZone(date, 'Australia/Sydney');
}

/** Formats a date as YYYY-MM-DD in the requested time zone. */
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

/** Returns today's date in Australian Eastern time. */
export function getTodayInAest(): string {
  return getTodayInTimeZone('Australia/Sydney');
}

/** Returns today's date in the requested time zone. */
export function getTodayInTimeZone(timeZone: string): string {
  return formatDateInTimeZone(new Date(), timeZone);
}

/** Adds calendar days while preserving the date-only representation. */
export function addDays(date: string, days: number): string {
  const result = parseDateOnly(date);
  result.setUTCDate(result.getUTCDate() + days);
  return formatDateOnly(result);
}

/** Parses and validates a date-only value without applying local timezone offsets. */
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

/** Identifies weekend dates using UTC day values. */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Converts a UTC date to the utility's date-only representation. */
function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}