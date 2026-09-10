import { Page } from '@playwright/test';
import { mobileConfig } from '../config';

export class MobileLoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(`${mobileConfig.baseUrl}/index.htm`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.locator('input[name="username"]').fill(username);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.locator('input[value="Log In"]').click();
  }

  async openRegistration(): Promise<void> {
    await this.page.getByRole('link', { name: 'Register' }).click();
  }
}