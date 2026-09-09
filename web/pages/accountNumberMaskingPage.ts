/** Page object for verifying account-number visibility and masking controls. */
import fs from 'fs';
import path from 'path';
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestUtils } from '../support/webTestutils';

export class AccountNumberMaskingPage extends BasePage {
  readonly heading: Locator;
  readonly accountTable: Locator;
  readonly firstAccountLink: Locator;
  readonly maskOrRevealControls: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Accounts Overview' });
    this.accountTable = page.locator('#accountTable');
    this.firstAccountLink = this.accountTable.locator('tbody tr td a').first();
    this.maskOrRevealControls = page.locator('button, a, input').filter({ hasText: /mask|reveal|show|hide|unmask/i });
  }

  async openAccountsOverview(): Promise<void> {
    await this.page.getByRole('link', { name: 'Accounts Overview' }).click();
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  async getFirstAccountNumber(): Promise<string> {
    await expect(this.firstAccountLink).toBeVisible({ timeout: 15000 });
    const accountNumber = (await this.firstAccountLink.innerText()).trim();
    if (!accountNumber) {
      throw new Error('No account number was present in the Accounts Overview table.');
    }
    return accountNumber;
  }

  async isAccountNumberMasked(): Promise<boolean> {
    const accountNumber = await this.getFirstAccountNumber();
    const plainDigitsOnly = /^\d+$/.test(accountNumber);
    const hasMaskingPattern = /[*xX•\u2022]|\*{2,}|[A-Za-z]/.test(accountNumber);
    return !plainDigitsOnly && hasMaskingPattern;
  }

  async hasMaskingOrRevealControl(): Promise<boolean> {
    const controls = await this.maskOrRevealControls.filter({ hasText: /mask|reveal|show|hide|unmask/i }).count();
    return controls > 0;
  }

  async captureScreenshot(fileName: string): Promise<string> {
    const screenshotPath = TestUtils.screenshotPath(fileName);
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }
}
