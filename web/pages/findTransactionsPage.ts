/** Page object for searching transactions and extracting result details. */
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
 
export type PersonDetails = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};
 
export class FindTransactionsPage extends BasePage {
  readonly heading: Locator;
  readonly account: Locator;
  readonly amount: Locator;
  readonly amountSearchButton: Locator;
  readonly resultsTable: Locator;
 
  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Find Transactions' });
    this.account = page.locator('select').first();
    this.amount = page.locator('#amount');
    this.amountSearchButton = page.locator('button').filter({ hasText: 'Find Transactions' }).last();
    this.resultsTable = page.locator('table').last();
  }
 
  async open(accountId: string): Promise<void> {
    await this.page.getByRole('link', { name: 'Find Transactions' }).click();
    await this.page.waitForURL(/findtrans\.htm/);
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await this.account.selectOption({ label: accountId });
  }
 
  async searchByAmount(amount: string): Promise<void> {
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
 
  async getPersonDetails(): Promise<PersonDetails> {
    const details: PersonDetails = {};
    
    // Try to get person details from account information section
    const accountInfo = await this.page.locator('[class*="account-info"], [class*="person-details"]').textContent();
    if (accountInfo) {
      const nameMatch = accountInfo.match(/(?:Name|Person|Customer):\s*([A-Za-z\s]+)/i);
      if (nameMatch) {
        details.fullName = nameMatch[1].trim();
      }
      
      const phoneMatch = accountInfo.match(/(?:Phone|Tel):\s*(\d[\d\s\-\(\)]+)/i);
      if (phoneMatch) {
        details.phone = phoneMatch[1].trim();
      }
      
      const addressMatch = accountInfo.match(/(?:Address):\s*([^\n,]+)/i);
      if (addressMatch) {
        details.address = addressMatch[1].trim();
      }
    }
    
    return details;
  }
 
  async getTransactionResultsWithPersonDetails(): Promise<{ personDetails: PersonDetails; transactions: any[] }> {
    const personDetails = await this.getPersonDetails();
    const transactions = await this.getResultsWithDetails();
    
    return { personDetails, transactions };
  }
 
  async getResultsWithDetails(): Promise<any[]> {
    const rows = await this.resultsTable.locator('tbody tr').evaluateAll((elements) =>
      elements.map((row) =>
        Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? '')
      )
    );
    
    return rows.filter((cells) => cells.length >= 3).map((cells) => ({
      date: cells[0] || '',
      description: cells[1] || '',
      amount: cells.slice(2)
        .map((value) => Number(value.replace(/[^\d.-]/g, '')))
        .find((value) => Number.isFinite(value) && value > 0) || 0,
      rawData: cells
    }));
  }
 
  async verifyPersonDetailsPresent(): Promise<boolean> {
    const details = await this.getPersonDetails();
    return !!(
      details.fullName ||
      details.phone ||
      details.address
    );
  }
}
 