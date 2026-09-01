export function parseIsoDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return date;
}

export function isFutureDate(value: string): boolean {
  return parseIsoDate(value).getTime() > Date.now();
}

export function asUtcIso(value: Date): string {
  return value.toISOString();
}
