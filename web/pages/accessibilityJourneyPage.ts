import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccessibilityJourneyPage extends BasePage {
  readonly loginUsername;
  readonly loginPassword;
  readonly loginButton;
  readonly accountsOverviewLink;

  constructor(page: Page) {
    super(page);
    this.loginUsername = page.locator('input[name="username"]');
    this.loginPassword = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.accountsOverviewLink = page.getByRole('link', { name: /Accounts Overview/i });
  }

  async openLoginPage() {
    await this.page.goto(process.env.WEB_BASE_URL || '');
    await expect(this.loginUsername).toBeVisible({ timeout: 15000 });
    await expect(this.loginPassword).toBeVisible({ timeout: 15000 });
  }

  async expectLoginFormAccessible() {
    await expect(this.loginUsername).toBeVisible({ timeout: 15000 });
    await expect(this.loginPassword).toBeVisible({ timeout: 15000 });
    await expect(this.loginButton).toBeVisible({ timeout: 15000 });

    const interactiveCount = await this.page.locator('input, button, a').count();
    expect(interactiveCount).toBeGreaterThan(0);
  }

  async expectDashboardAccessible() {
    await expect(this.accountsOverviewLink).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByRole('link', { name: /Open New Account/i })).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: /Accounts Overview/i })).toBeVisible({ timeout: 15000 });

    const interactiveCount = await this.page.locator('a, button, input').count();
    expect(interactiveCount).toBeGreaterThan(0);
  }
}
