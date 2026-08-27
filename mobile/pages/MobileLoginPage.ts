import { expect, Page } from '@playwright/test';

export class MobileLoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('https://parabank.parasoft.com/parabank/index.htm', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.locator('input[name="username"]').fill(username);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.locator('input[value="Log In"]').click();
    await this.verifyLoginSuccess();
  }

  async verifyLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/overview\.htm/, { timeout: 20000 });
  }

  async openRegistration(): Promise<void> {
    await this.page.getByRole('link', { name: 'Register' }).click();
    await expect(this.page).toHaveURL(/register\.htm/);
  }
}