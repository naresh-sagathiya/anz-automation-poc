import dotenv from 'dotenv';

dotenv.config();

export const mobileConfig = {
  baseUrl:
    process.env.MOBILE_BASE_URL ||
    process.env.PARABANK_BASE_URL ||
    process.env.API_BASE_URL?.replace(/\/services\/bank\/?$/, '') ||
    'https://parabank.parasoft.com/parabank',
  username: process.env.PARABANK_USER || 'john',
  password: process.env.PARABANK_PASS || 'demo',
  headless: process.env.HEADLESS !== 'false',
  slowMoMs: Number.parseInt(process.env.MOBILE_SLOWMO_MS || process.env.PW_SLOWMO_MS || '0', 10),
};

export function redactSensitive(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b\d{13,19}\b/g, '[PAN-REDACTED]')
    .replace(/\b\d{6,}\b/g, '[ACCOUNT-REDACTED]');
}
