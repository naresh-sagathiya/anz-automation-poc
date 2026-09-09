/** Page object for login, logout, and registration navigation. */
import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);

    this.username = page.locator('input[name="username"]');
    this.password = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.registerLink = page.getByRole('link', { name: 'Register' });
    this.logoutLink = page.getByRole('link', { name: /Log Out/i });
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async logout(): Promise<void> {
    if (await this.logoutLink.isVisible().catch(() => false)) {
      await this.logoutLink.click();
    }
  }

  async openRegistration(): Promise<void> {
    await this.registerLink.click();
    await this.page.waitForURL(/register\.htm/);
  }
}