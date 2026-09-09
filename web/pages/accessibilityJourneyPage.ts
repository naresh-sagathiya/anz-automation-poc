/** Page object for accessibility checks across the login and account overview journeys. */
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccessibilityJourneyPage extends BasePage {
  readonly loginUsername: Locator;
  readonly loginPassword: Locator;
  readonly loginButton: Locator;
  readonly accountsOverviewLink: Locator;

  constructor(page: Page) {
    super(page);
    this.loginUsername = page.locator('input[name="username"]');
    this.loginPassword = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.accountsOverviewLink = page.getByRole('link', { name: /Accounts Overview/i });
  }

  async openLoginPage(): Promise<void> {
    await this.page.goto(process.env.WEB_BASE_URL || '');
    await expect(this.loginUsername).toBeVisible({ timeout: 15000 });
    await expect(this.loginPassword).toBeVisible({ timeout: 15000 });
  }

  async expectLoginFormAccessible(): Promise<void> {
    await expect(this.loginUsername).toBeVisible({ timeout: 15000 });
    await expect(this.loginPassword).toBeVisible({ timeout: 15000 });
    await expect(this.loginButton).toBeVisible({ timeout: 15000 });

    const interactiveCount = await this.page.locator('input, button, a').count();
    expect(interactiveCount).toBeGreaterThan(0);
  }

  async expectDashboardAccessible(): Promise<void> {
    await expect(this.accountsOverviewLink).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByRole('link', { name: /Open New Account/i })).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: /Accounts Overview/i })).toBeVisible({ timeout: 15000 });

    const interactiveCount = await this.page.locator('a, button, input').count();
    expect(interactiveCount).toBeGreaterThan(0);
  }
}
