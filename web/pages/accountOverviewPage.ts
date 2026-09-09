import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountOverviewPage extends BasePage {
  readonly heading;
  readonly accountRows;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Accounts Overview' });
    this.accountRows = page.locator('#accountTable tbody tr').filter({ has: page.locator('td a') });
  }

  async open() {
    await this.page.getByRole('link', { name: 'Accounts Overview' }).click();
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  async getFirstAccountId(): Promise<string> {
    const accountLink = this.accountRows.locator('td a').first();
    await expect(accountLink).toBeVisible({ timeout: 15000 });
    return (await accountLink.innerText()).trim();
  }

  async getBalance(accountId: string): Promise<number> {
    const row = this.accountRows.filter({ has: this.page.locator(`td a[href*="id=${accountId}"]`) });
    await expect(row).toHaveCount(1, { timeout: 15000 });
    return this.parseCurrency(await row.locator('td').nth(1).innerText());
  }

  private parseCurrency(value: string): number {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(parsed)) {
      throw new Error(`Could not parse account balance: ${value}`);
    }
    return parsed;
  }
}