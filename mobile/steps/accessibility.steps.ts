import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';

type AccessibilityScanState = {
  lastSummary: {
    critical: number;
    serious: number;
    total: number;
    violations: Array<{ id: string; impact: string; description: string; nodes: number }>;
  } | null;
};

function getAccessibilityState(world: MobileWorld): AccessibilityScanState {
  const scoped = world as MobileWorld & { accessibilityScanState?: AccessibilityScanState };

  if (!scoped.accessibilityScanState) {
    scoped.accessibilityScanState = {
      lastSummary: null,
    };
  }

  return scoped.accessibilityScanState;
}

async function runScan(page: any, screen: string) {
  const axe = await import('@axe-core/playwright');
  const AxeBuilder = axe.default || axe.AxeBuilder;
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const violations = result.violations.map((violation: any) => ({
    id: violation.id,
    impact: violation.impact || 'unknown',
    description: violation.help || violation.helpUrl || violation.id,
    nodes: violation.nodes?.length || 0,
  }));

  const critical = violations.filter((item) => item.impact === 'critical').length;
  const serious = violations.filter((item) => item.impact === 'serious').length;

  return {
    screen,
    critical,
    serious,
    total: violations.length,
    violations,
  };
}

When('I run a WCAG 2.1 AA accessibility scan on the mobile {string} page', async function (this: MobileWorld, screen: string) {
  const state = getAccessibilityState(this);

  if (screen === 'login') {
    await this.page.goto(process.env.MOBILE_BASE_URL || process.env.PARABANK_BASE_URL || 'https://parabank.parasoft.com/parabank', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  }

  if (screen === 'dashboard') {
    const user = process.env.PARABANK_USER || 'john';
    const pass = process.env.PARABANK_PASS || 'demo';
    await this.page.fill('input[name="username"]', user);
    await this.page.fill('input[name="password"]', pass);
    await this.page.click('input[value="Log In"]');
    await this.page.waitForSelector('text=Accounts Overview', { timeout: 30000 });
  }

  if (screen === 'transfer') {
    const user = process.env.PARABANK_USER || 'john';
    const pass = process.env.PARABANK_PASS || 'demo';
    await this.page.fill('input[name="username"]', user);
    await this.page.fill('input[name="password"]', pass);
    await this.page.click('input[value="Log In"]');
    await this.page.waitForSelector('text=Accounts Overview', { timeout: 30000 });
    await this.page.click('text=Transfer Funds');
    await this.page.waitForURL(/transfer\.htm/, { timeout: 30000 });
  }

  state.lastSummary = await runScan(this.page, screen);
});

Then('the mobile accessibility scan for {string} should complete and report at least one mobile accessibility finding', async function (this: MobileWorld, screen: string) {
  const state = getAccessibilityState(this);
  const summary = state.lastSummary;

  expect(summary, `Accessibility scan result missing for ${screen}`).not.toBeNull();
  expect(summary!.total, `Accessibility scan did not return any findings for ${screen}`).toBeGreaterThan(0);
  expect(summary!.violations.length, `Accessibility scan reported no rules for ${screen}`).toBeGreaterThan(0);
  expect(summary!.violations.some((violation) => ['serious', 'critical', 'moderate', 'minor'].includes(violation.impact ?? '')),
    `No valid impact level found in the scan result for ${screen}: ${JSON.stringify(summary!.violations)}`).toBe(true);
});
