import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';
import fs from 'node:fs/promises';
import path from 'node:path';

type TouchMetric = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

type M14State = {
  screen?: string;
  minSize: number;
  minSpacing: number;
  metrics: TouchMetric[];
  selectors: string[];
  sizeViolations: string[];
  spacingViolations: string[];
};

type M14ReportRecord = {
  id: 'ID-M14';
  timestamp: string;
  screen: string;
  checkType: 'size' | 'spacing';
  status: 'pass' | 'fail';
  minSize: number;
  minSpacing: number;
  measuredCount: number;
  violations: string[];
  measurements: Array<{
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

function formatNum(value: number): string {
  return value.toFixed(2);
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isEnabled(value: string | undefined, fallback = true): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  return fallback;
}

function getReportPaths(): { jsonPath: string; csvPath: string } {
  const reportsDir = process.env.MOBILE_TOUCH_REPORT_DIR || 'reports';
  const baseName = process.env.MOBILE_TOUCH_REPORT_BASENAME || 'id-m14-touch-target-report';
  return {
    jsonPath: path.join(reportsDir, `${baseName}.json`),
    csvPath: path.join(reportsDir, `${baseName}.csv`),
  };
}

function getTextReportPath(): string {
  const reportsDir = process.env.MOBILE_TOUCH_REPORT_DIR || 'reports';
  const baseName = process.env.MOBILE_TOUCH_REPORT_BASENAME || 'id-m14-touch-target-report';
  return path.join(reportsDir, `${baseName}.txt`);
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

async function appendM14Report(record: M14ReportRecord): Promise<void> {
  if (!isEnabled(process.env.MOBILE_TOUCH_REPORT_ENABLED, true)) {
    return;
  }

  const { jsonPath, csvPath } = getReportPaths();
  const reportsDir = path.dirname(jsonPath);
  await fs.mkdir(reportsDir, { recursive: true });

  let existingRecords: M14ReportRecord[] = [];
  try {
    const existing = await fs.readFile(jsonPath, 'utf8');
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed)) {
      existingRecords = parsed as M14ReportRecord[];
    }
  } catch {
    existingRecords = [];
  }

  existingRecords.push(record);
  await fs.writeFile(jsonPath, JSON.stringify(existingRecords, null, 2), 'utf8');

  const header = 'timestamp,id,screen,checkType,status,minSize,minSpacing,measuredCount,violations,measurements\n';
  const violationsText = record.violations.join(' | ');
  const measurementsText = record.measurements
    .map((m) => `${m.name}:${formatNum(m.width)}x${formatNum(m.height)}@(${formatNum(m.x)},${formatNum(m.y)})`)
    .join(' | ');
  const row = [
    record.timestamp,
    record.id,
    record.screen,
    record.checkType,
    record.status,
    String(record.minSize),
    String(record.minSpacing),
    String(record.measuredCount),
    violationsText,
    measurementsText,
  ]
    .map(csvEscape)
    .join(',') + '\n';

  try {
    await fs.access(csvPath);
  } catch {
    await fs.writeFile(csvPath, header, 'utf8');
  }

  await fs.appendFile(csvPath, row, 'utf8');
}

async function appendM14TextLine(line: string): Promise<void> {
  if (!isEnabled(process.env.MOBILE_TOUCH_REPORT_ENABLED, true)) {
    return;
  }
  const textPath = getTextReportPath();
  await fs.mkdir(path.dirname(textPath), { recursive: true });
  await fs.appendFile(textPath, `${line}\n`, 'utf8');
}

async function appendMeasurementSummary(state: M14State): Promise<void> {
  const lines = state.metrics.map(
    (metric) =>
      `${metric.name} -> ${formatNum(metric.width)}x${formatNum(metric.height)} at (${formatNum(metric.x)}, ${formatNum(metric.y)})`,
  );
  const stamp = new Date().toISOString();
  await appendM14TextLine(`[${stamp}] [ID-M14][${state.screen}] Touch targets measured:`);
  for (const line of lines) {
    await appendM14TextLine(`  ${line}`);
  }
}

async function appendViolationSummary(screen: string | undefined, checkType: 'size' | 'spacing', violations: string[]): Promise<void> {
  const stamp = new Date().toISOString();
  const title = checkType === 'size' ? 'size' : 'spacing';
  await appendM14TextLine(`[${stamp}] [ID-M14][${screen}] ${title} violations (${violations.length}):`);
  for (const violation of violations) {
    await appendM14TextLine(`  ${violation}`);
  }
}

function getM14State(world: MobileWorld): M14State {
  const scoped = world as MobileWorld & { m14State?: M14State };
  if (!scoped.m14State) {
    scoped.m14State = {
      minSize: toPositiveInt(process.env.MOBILE_TOUCH_TARGET_MIN_SIZE || process.env.TOUCH_TARGET_MIN_SIZE, 44),
      minSpacing: toPositiveInt(process.env.MOBILE_TOUCH_TARGET_MIN_SPACING || process.env.TOUCH_TARGET_MIN_SPACING, 8),
      metrics: [],
      selectors: [],
      sizeViolations: [],
      spacingViolations: [],
    };
  }
  return scoped.m14State;
}

function getBaseUrl(): string {
  const apiBaseUrl = process.env.API_BASE_URL;
  const derivedBaseUrl = apiBaseUrl ? apiBaseUrl.replace(/\/services\/bank\/?$/, '') : undefined;
  return process.env.MOBILE_BASE_URL || process.env.PARABANK_BASE_URL || derivedBaseUrl || 'https://parabank.parasoft.com/parabank';
}

async function loginToParabank(world: MobileWorld): Promise<void> {
  const username = process.env.PARABANK_USER || 'john';
  const password = process.env.PARABANK_PASS || 'demo';

  await world.page.fill('input[name="username"]', username);
  await world.page.fill('input[name="password"]', password);
  await world.page.click('input[value="Log In"]');
  await expect(world.page).toHaveURL(/overview\.htm/, { timeout: 20000 });
}

Given('I open the mobile banking touch target screen {string}', async function (this: MobileWorld, screen: string) {
  const state = getM14State(this);
  const baseUrl = getBaseUrl();

  if (screen === 'login') {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    state.selectors = [
      'input[name="username"]',
      'input[name="password"]',
      'input[value="Log In"]',
      'a[href*="register"]',
    ];
  } else if (screen === 'account-overview') {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await loginToParabank(this);
    state.selectors = [
      'a:has-text("Open New Account")',
      'a:has-text("Accounts Overview")',
      'a:has-text("Transfer Funds")',
      'a:has-text("Bill Pay")',
      'a:has-text("Find Transactions")',
      'a:has-text("Request Loan")',
      'a:has-text("Log Out")',
    ];
  } else if (screen === 'payments') {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await loginToParabank(this);
    await this.page.click('a:has-text("Bill Pay")');
    await expect(this.page).toHaveURL(/billpay\.htm/, { timeout: 20000 });
    state.selectors = [
      'input[name="payee.name"]',
      'input[name="payee.address.street"]',
      'input[name="payee.phoneNumber"]',
      'input[name="payee.accountNumber"]',
      'input[name="verifyAccount"]',
      'input[name="amount"]',
      'input[value="Send Payment"]',
    ];
  } else {
    throw new Error(`Unsupported touch target screen: ${screen}`);
  }

  state.screen = screen;
  state.metrics = [];
  state.sizeViolations = [];
  state.spacingViolations = [];
});

When('I measure all interactive touch targets on the screen', async function (this: MobileWorld) {
  const state = getM14State(this);
  expect(state.selectors.length).toBeGreaterThan(0);

  const metrics: TouchMetric[] = [];
  for (const selector of state.selectors) {
    const target = this.page.locator(selector).first();
    await expect(target, `Target not visible for selector: ${selector}`).toBeVisible({ timeout: 15000 });

    const box = await target.boundingBox();
    expect(box).not.toBeNull();

    if (!box) {
      continue;
    }

    const name = selector;
    metrics.push({
      name,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      right: box.x + box.width,
      bottom: box.y + box.height,
    });
  }

  state.metrics = metrics;
  await appendMeasurementSummary(state);
});

Then('each interactive element meets the minimum touch target size', async function (this: MobileWorld) {
  const state = getM14State(this);
  expect(state.metrics.length).toBeGreaterThan(0);

  const violations: string[] = [];
  for (const metric of state.metrics) {
    if (metric.width < state.minSize || metric.height < state.minSize) {
      violations.push(
        `${metric.name}: measured ${formatNum(metric.width)}x${formatNum(metric.height)}, expected >= ${state.minSize}x${state.minSize}`,
      );
    }
  }

  state.sizeViolations = violations;

  await appendM14Report({
    id: 'ID-M14',
    timestamp: new Date().toISOString(),
    screen: state.screen || 'unknown',
    checkType: 'size',
    status: violations.length > 0 ? 'fail' : 'pass',
    minSize: state.minSize,
    minSpacing: state.minSpacing,
    measuredCount: state.metrics.length,
    violations,
    measurements: state.metrics.map((metric) => ({
      name: metric.name,
      x: metric.x,
      y: metric.y,
      width: metric.width,
      height: metric.height,
    })),
  });

  if (violations.length > 0) {
    await appendViolationSummary(state.screen, 'size', violations);
    throw new Error('[ID-M14] Touch target size validation failed. See reports/id-m14-touch-target-report.txt for details.');
  }
});

Then('interactive elements have adequate spacing', async function (this: MobileWorld) {
  const state = getM14State(this);
  expect(state.metrics.length).toBeGreaterThan(1);

  const spacingViolations: string[] = [];
  for (let i = 0; i < state.metrics.length; i++) {
    for (let j = i + 1; j < state.metrics.length; j++) {
      const first = state.metrics[i];
      const second = state.metrics[j];

      const horizontalGap = Math.max(0, Math.max(first.x, second.x) - Math.min(first.right, second.right));
      const verticalGap = Math.max(0, Math.max(first.y, second.y) - Math.min(first.bottom, second.bottom));

      // Adjacent controls on one axis should keep minimum spacing on the opposite axis.
      if (horizontalGap === 0 || verticalGap === 0) {
        const edgeGap = Math.max(horizontalGap, verticalGap);
        if (edgeGap < state.minSpacing) {
          spacingViolations.push(
            `${first.name} <-> ${second.name}: gap=${formatNum(edgeGap)}px, expected >= ${state.minSpacing}px`,
          );
        }
      }
    }
  }

  state.spacingViolations = spacingViolations;

  await appendM14Report({
    id: 'ID-M14',
    timestamp: new Date().toISOString(),
    screen: state.screen || 'unknown',
    checkType: 'spacing',
    status: spacingViolations.length > 0 ? 'fail' : 'pass',
    minSize: state.minSize,
    minSpacing: state.minSpacing,
    measuredCount: state.metrics.length,
    violations: spacingViolations,
    measurements: state.metrics.map((metric) => ({
      name: metric.name,
      x: metric.x,
      y: metric.y,
      width: metric.width,
      height: metric.height,
    })),
  });

  if (spacingViolations.length > 0) {
    await appendViolationSummary(state.screen, 'spacing', spacingViolations);
    throw new Error('[ID-M14] Touch target spacing validation failed. See reports/id-m14-touch-target-report.txt for details.');
  }
});