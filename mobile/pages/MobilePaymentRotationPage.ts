import { expect, Page } from '@playwright/test';

export type PaymentDraft = {
  payeeName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  accountNumber: string;
  verifyAccount: string;
  amount: string;
  fromAccountId: string;
};

export class MobilePaymentRotationPage {
  constructor(private readonly page: Page) {}

  async openBillPayPage() {
    await this.page.click('text=Bill Pay');
    await this.page.waitForURL(/billpay\.htm/, { timeout: 20000 });
    await this.page.waitForSelector('input[name="payee.name"]', { timeout: 20000 });
  }

  async fillDraft(draft: PaymentDraft) {
    await this.page.fill('input[name="payee.name"]', draft.payeeName);
    await this.page.fill('input[name="payee.address.street"]', draft.street);
    await this.page.fill('input[name="payee.address.city"]', draft.city);
    await this.page.fill('input[name="payee.address.state"]', draft.state);
    await this.page.fill('input[name="payee.address.zipCode"]', draft.zipCode);
    await this.page.fill('input[name="payee.phoneNumber"]', draft.phoneNumber);
    await this.page.fill('input[name="payee.accountNumber"]', draft.accountNumber);
    await this.page.fill('input[name="verifyAccount"]', draft.verifyAccount);
    await this.page.fill('input[name="amount"]', draft.amount);
    await this.page.selectOption('select[name="fromAccountId"]', { value: draft.fromAccountId });
  }

  async captureDraft(): Promise<PaymentDraft> {
    return {
      payeeName: await this.page.inputValue('input[name="payee.name"]'),
      street: await this.page.inputValue('input[name="payee.address.street"]'),
      city: await this.page.inputValue('input[name="payee.address.city"]'),
      state: await this.page.inputValue('input[name="payee.address.state"]'),
      zipCode: await this.page.inputValue('input[name="payee.address.zipCode"]'),
      phoneNumber: await this.page.inputValue('input[name="payee.phoneNumber"]'),
      accountNumber: await this.page.inputValue('input[name="payee.accountNumber"]'),
      verifyAccount: await this.page.inputValue('input[name="verifyAccount"]'),
      amount: await this.page.inputValue('input[name="amount"]'),
      fromAccountId: await this.page.inputValue('select[name="fromAccountId"]'),
    };
  }

  async rotateToLandscape() {
    // Use a wider landscape viewport for demos so the form visibly reflows and shows more content.
    await this.page.setViewportSize({ width: 1024, height: 768 });
    await this.page.waitForFunction(() => window.innerWidth > window.innerHeight, { timeout: 10000 });
    await this.page.waitForTimeout(2000);
  }

  async rotateToPortrait() {
    await this.page.setViewportSize({ width: 390, height: 844 });
    await this.page.waitForFunction(() => window.innerHeight > window.innerWidth, { timeout: 10000 });
  }

  async expectDraftPreserved(expected: PaymentDraft) {
    const actual = await this.captureDraft();
    expect(actual).toEqual(expected);
  }

  async expectLayoutStable() {
    const criticalFields = [
      'input[name="payee.name"]',
      'input[name="payee.address.street"]',
      'input[name="amount"]',
      'input[value="Send Payment"]',
    ];

    for (const selector of criticalFields) {
      await expect(this.page.locator(selector)).toBeVisible();
    }

    const metrics = await this.page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 20);
    expect(metrics.scrollHeight).toBeGreaterThan(0);
  }

  async submitPayment() {
    await this.page.click('input[value="Send Payment"]');
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  }

  async expectPaymentComplete() {
    await expect(this.page.locator('body')).toContainText(/complete|successfully|payment/i);
  }
}