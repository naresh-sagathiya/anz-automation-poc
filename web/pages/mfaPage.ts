/** Page object for GitHub MFA login and one-time-password validation. */
import { Locator, Page, expect } from '@playwright/test';

export class MFAPage  {
  readonly username: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator('#login_field');
    this.password = page.locator('#password');
    this.signInButton = page.locator('input[type="submit"]');

  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.signInButton.click();
  }

 async EnterOTP(code: string): Promise<void> {
    const otpInput = this.page.locator('#app_totp, input[name="otp"]');
    await otpInput.waitFor({ timeout: 30000 });
    await otpInput.fill(code);
  }

  async EnterInvalidOTP(code: string): Promise<void> {
    const otpInput = this.page.locator('#app_totp, input[name="otp"]');
    await otpInput.waitFor({ timeout: 30000 });
    await otpInput.fill(code);
    await this.page.getByRole('button', { name: 'Verify' }).dispatchEvent('click');
    await expect(this.page.getByText('Two-factor authentication failed.', { exact: true })).toBeVisible({ timeout: 10000 });
  }

  async PreReq(): Promise<void>{
      if (!process.env.GITHUB_USER ||
      !process.env.GITHUB_PASS ||
      !process.env.GITHUB_MFA_SECRET) {
    throw new Error('Required environment variables are missing');
  }
  }
}