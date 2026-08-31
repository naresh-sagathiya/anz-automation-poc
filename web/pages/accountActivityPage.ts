import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type TransactionRow = {
  date: string;
  description: string;
  debit: number;
  credit: number;
};

export class AccountActivityPage extends BasePage {
  readonly accountDetailsTable;
  readonly transactionRows;

  constructor(page: Page) {
    super(page);
    this.accountDetailsTable = page.locator('table').first();
    this.transactionRows = page.locator('table').filter({
      has: page.getByRole('columnheader', { name: 'Debit (-)' }),
    }).locator('tbody tr');
  }

  async open(accountId: string) {
    await this.page.getByRole('link', { name: accountId, exact: true }).click();
    await this.page.waitForURL(/activity\.htm\?id=/);
    await expect(this.page.getByRole('heading', { name: 'Account Activity' })).toBeVisible({ timeout: 15000 });
  }

  async getAccountDetailBalance(): Promise<number> {
    const balanceRow = this.accountDetailsTable.locator('tr').filter({ hasText: 'Balance:' });
    const balanceCell = balanceRow.locator('td').nth(1);
    await expect(balanceCell).toHaveText(/\$\s*[\d,.]+/, { timeout: 15000 });
    return this.parseCurrency(await balanceCell.innerText());
  }

  async getTransactions(): Promise<TransactionRow[]> {
    const rows = await this.transactionRows.evaluateAll((elements) => elements.map((row) =>
      Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? '')
    ));

    return rows.filter((cells) => cells.length >= 4).map(([date, description, debit, credit]) => ({
      date,
      description,
      debit: this.parseCurrency(debit),
      credit: this.parseCurrency(credit),
    }));
  }

  async calculateBalance(initialBalance: number): Promise<number> {
    await expect(this.transactionRows.first()).toBeVisible({ timeout: 15000 });
    const transactions = await this.getTransactions();
    return transactions.reduce((balance, transaction) =>
      balance - transaction.debit + transaction.credit, initialBalance);
  }

  private parseCurrency(value: string): number {
    if (!value) {
      return 0;
    }
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(parsed)) {
      throw new Error(`Could not parse transaction amount: ${value}`);
    }
    return parsed;
  }
}