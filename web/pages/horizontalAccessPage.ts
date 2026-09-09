/** Page object for registering users and checking access isolation between accounts. */
import { expect, Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './registerPage';
import { AccountOverviewPage } from './accountOverviewPage';

export class HorizontalAccessPage {
  constructor(private readonly page: Page) {}

  async registerUser(data: Record<string, string>): Promise<{ username: string; password: string }> {
    await this.page.goto(process.env.WEB_BASE_URL!);
    await new LoginPage(this.page).openRegistration();
    return new RegisterPage(this.page).register(data);
  }

  async getFirstAccountId(): Promise<string> {
    return new AccountOverviewPage(this.page).getFirstAccountId();
  }

  async openAccountActivity(accountId: string): Promise<string> {
    const accountUrl = new URL(`activity.htm?id=${encodeURIComponent(accountId)}`, process.env.WEB_BASE_URL!).toString();
    await this.page.goto(accountUrl);
    await expect(this.page.locator('body')).toBeVisible({ timeout: 15000 });
    return this.page.locator('body').innerText();
  }
}