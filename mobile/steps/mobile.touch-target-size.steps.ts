import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';

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
};

function formatNum(value: number): string {
  return value.toFixed(2);
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getM14State(world: MobileWorld): M14State {
  const scoped = world as MobileWorld & { m14State?: M14State };
  if (!scoped.m14State) {
    scoped.m14State = {
      minSize: toPositiveInt(process.env.MOBILE_TOUCH_TARGET_MIN_SIZE || process.env.TOUCH_TARGET_MIN_SIZE, 44),
      minSpacing: toPositiveInt(process.env.MOBILE_TOUCH_TARGET_MIN_SPACING || process.env.TOUCH_TARGET_MIN_SPACING, 8),
      metrics: [],
      selectors: [],
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

  const summary = metrics
    .map((metric) => `${metric.name} -> ${formatNum(metric.width)}x${formatNum(metric.height)} at (${formatNum(metric.x)}, ${formatNum(metric.y)})`)
    .join('\n');
  console.log(`[ID-M14][${state.screen}] Touch targets measured:\n${summary}`);
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

  if (violations.length > 0) {
    throw new Error(
      `[ID-M14][${state.screen}] Touch target size violations (${violations.length}):\n${violations.join('\n')}`,
    );
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

  if (spacingViolations.length > 0) {
    throw new Error(
      `[ID-M14][${state.screen}] Touch target spacing violations (${spacingViolations.length}):\n${spacingViolations.join('\n')}`,
    );
  }
});