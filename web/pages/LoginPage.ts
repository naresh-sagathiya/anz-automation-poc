import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly username;
  readonly password;
  readonly loginButton;
  readonly registerLink;
  readonly logoutLink;

  constructor(page: Page) {
    super(page);

    this.username = page.locator('input[name="username"]');
    this.password = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.registerLink = page.getByRole('link', { name: 'Register' });
    this.logoutLink = page.getByRole('link', { name: /Log Out/i });
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
    await expect(this.page.getByText('Accounts Overview').first()).toBeVisible();
  }

  async logout() {
    if (await this.logoutLink.isVisible().catch(() => false)) {
      await this.logoutLink.click();
    }
  }

  async openRegistration() {
    await this.registerLink.click();
    await this.page.waitForURL(/register\.htm/);
  }
}