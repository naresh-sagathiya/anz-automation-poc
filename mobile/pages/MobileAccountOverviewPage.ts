import { Locator, Page } from '@playwright/test';

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

  navigationLinks(): Locator[] {
    return [
      this.openNewAccountLink,
      this.accountsOverviewLink,
      this.transferFundsLink,
      this.billPayLink,
      this.findTransactionsLink,
      this.updateContactInfoLink,
      this.requestLoanLink,
      this.logoutLink,
    ];
  }

  async navigateTo(link: Locator): Promise<void> {
    await link.click();
  }

  async hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }
}