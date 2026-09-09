/** Page object for completing bill payments and validating payment outcomes. */
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type BillPayDetails = {
  payeeName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  account: string;
  verifyAccount: string;
  amount: string;
};

export class BillPayPage extends BasePage {
  readonly billPayLink: Locator;
  readonly payeeName: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zipCode: Locator;
  readonly phone: Locator;
  readonly account: Locator;
  readonly verifyAccount: Locator;
  readonly amount: Locator;
  readonly fromAccount: Locator;
  readonly sendPaymentButton: Locator;
  readonly paymentCompleteHeading: Locator;
  readonly paymentError: Locator;

  constructor(page: Page) {
    super(page);
    this.billPayLink = page.getByRole('link', { name: 'Bill Pay' });
    this.payeeName = page.locator('input[name="payee.name"]');
    this.address = page.locator('input[name="payee.address.street"]');
    this.city = page.locator('input[name="payee.address.city"]');
    this.state = page.locator('input[name="payee.address.state"]');
    this.zipCode = page.locator('input[name="payee.address.zipCode"]');
    this.phone = page.locator('input[name="payee.phoneNumber"]');
    this.account = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccount = page.locator('input[name="verifyAccount"]');
    this.amount = page.locator('input[name="amount"]');
    this.fromAccount = page.locator('select[name="fromAccountId"]');
    this.sendPaymentButton = page.locator('input[value="Send Payment"]');
    this.paymentCompleteHeading = page.getByRole('heading', { name: 'Bill Payment Complete' });
    this.paymentError = page.locator('#rightPanel .error:visible, .error:visible').first();
  }

  async open(): Promise<void> {
    await this.billPayLink.click();
    await this.page.waitForURL(/billpay\.htm/);
    await expect(this.payeeName).toBeVisible({ timeout: 15000 });
    await expect(this.fromAccount.locator('option[value]:not([value=""])')).not.toHaveCount(0, { timeout: 15000 });
  }

  async fillPayment(details: BillPayDetails, amount = details.amount): Promise<void> {
    await this.payeeName.fill(details.payeeName);
    await this.address.fill(details.address);
    await this.city.fill(details.city);
    await this.state.fill(details.state);
    await this.zipCode.fill(details.zipCode);
    await this.phone.fill(details.phone);
    await this.account.fill(details.account);
    await this.verifyAccount.fill(details.verifyAccount);
    await this.amount.fill(amount);
    await this.fromAccount.selectOption({ index: 0 });
  }

  async submitPayment(): Promise<void> {
    await this.sendPaymentButton.click();
  }

  async submitMissingPayeeName(details: BillPayDetails): Promise<void> {
    await this.fillPayment(details);
    await this.payeeName.fill('');
    await this.submitPayment();
  }

  async submitMismatchedAccount(details: BillPayDetails): Promise<void> {
    await this.fillPayment(details);
    await this.verifyAccount.fill(`${details.account}9`);
    await this.submitPayment();
  }

  async expectPaymentComplete(): Promise<void> {
    await expect(this.paymentCompleteHeading).toBeVisible({ timeout: 15000 });
  }

  async expectPaymentError(): Promise<void> {
    await expect(this.paymentError).toBeVisible({ timeout: 15000 });
  }

  async submitPaymentTwice(): Promise<void> {
    await Promise.allSettled([
      this.sendPaymentButton.click({ noWaitAfter: true }),
      this.sendPaymentButton.click({ noWaitAfter: true }),
    ]);
    await this.expectPaymentComplete();
  }
}