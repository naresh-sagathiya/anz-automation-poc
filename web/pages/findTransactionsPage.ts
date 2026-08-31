import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class FindTransactionsPage extends BasePage {
  readonly heading;
  readonly account;
  readonly amount;
  readonly amountSearchButton;
  readonly resultsTable;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Find Transactions' });
    this.account = page.locator('select').first();
    this.amount = page.locator('#amount');
    this.amountSearchButton = page.locator('button').filter({ hasText: 'Find Transactions' }).last();
    this.resultsTable = page.locator('table').last();
  }

  async open(accountId: string) {
    await this.page.getByRole('link', { name: 'Find Transactions' }).click();
    await this.page.waitForURL(/findtrans\.htm/);
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await this.account.selectOption({ label: accountId });
  }

  async searchByAmount(amount: string) {
    await this.amount.fill(amount);
    await this.amountSearchButton.click();
    await expect(this.page.getByRole('heading', { name: 'Transaction Results' })).toBeVisible({ timeout: 15000 });
  }

  async getResultAmounts(): Promise<number[]> {
    const rows = await this.resultsTable.locator('tbody tr').evaluateAll((elements) => elements.map((row) =>
      Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? '')
    ));
    return rows.flatMap((cells) => cells.slice(2)
      .map((value) => Number(value.replace(/[^\d.-]/g, '')))
      .filter((value) => Number.isFinite(value) && value > 0));
  }

  async hasPaginationControls(): Promise<boolean> {
    return (await this.page.getByRole('link', { name: /next|previous/i }).count()) > 0;
  }
}