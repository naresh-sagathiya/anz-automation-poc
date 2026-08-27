import { expect, Locator, Page } from '@playwright/test';

export class MobileAccountOverviewPage {
  readonly openNewAccountLink: Locator;
  readonly accountsOverviewLink: Locator;
  readonly transferFundsLink: Locator;
  readonly billPayLink: Locator;
  readonly findTransactionsLink: Locator;
  readonly updateContactInfoLink: Locator;
  readonly requestLoanLink: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.openNewAccountLink = page.getByRole('link', { name: 'Open New Account' });
    this.accountsOverviewLink = page.getByRole('link', { name: 'Accounts Overview' });
    this.transferFundsLink = page.getByRole('link', { name: 'Transfer Funds' });
    this.billPayLink = page.getByRole('link', { name: 'Bill Pay' });
    this.findTransactionsLink = page.getByRole('link', { name: 'Find Transactions' });
    this.updateContactInfoLink = page.getByRole('link', { name: 'Update Contact Info' });
    this.requestLoanLink = page.getByRole('link', { name: 'Request Loan' });
    this.logoutLink = page.getByRole('link', { name: 'Log Out' });
  }

  async verifyNavigationMenu(): Promise<void> {
    await expect(this.openNewAccountLink).toBeVisible();
    await expect(this.accountsOverviewLink).toBeVisible();
    await expect(this.transferFundsLink).toBeVisible();
    await expect(this.billPayLink).toBeVisible();
    await expect(this.findTransactionsLink).toBeVisible();
    await expect(this.updateContactInfoLink).toBeVisible();
    await expect(this.requestLoanLink).toBeVisible();
    await expect(this.logoutLink).toBeVisible();
  }

  async navigateTo(link: Locator, urlPattern: RegExp): Promise<void> {
    await link.click();
    await expect(this.page).toHaveURL(urlPattern);
  }

  async hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }
}