/** Step definitions for account-number masking and evidence capture scenarios. */
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { AccountNumberMaskingPage } from '../pages/accountNumberMaskingPage';
import { CustomWorld } from '../support/world';

When('the customer navigates to Accounts Overview', async function (this: CustomWorld) {
  const pageObject = new AccountNumberMaskingPage(this.page);
  await pageObject.openAccountsOverview();
});

Then('the first account number is visible on the overview page', async function (this: CustomWorld) {
  const pageObject = new AccountNumberMaskingPage(this.page);
  const accountNumber = await pageObject.getFirstAccountNumber();
  expect(accountNumber).toMatch(/^\d+$/);
  this.openedAccountId = accountNumber;
});

Then('the first account number is not masked', async function () {
  const pageObject = new AccountNumberMaskingPage(this.page);
  const isMasked = await pageObject.isAccountNumberMasked();
  expect(isMasked).toBeFalsy();
});

Then('no account number masking or reveal control is available', async function () {
  const pageObject = new AccountNumberMaskingPage(this.page);
  const hasControl = await pageObject.hasMaskingOrRevealControl();
  expect(hasControl).toBeFalsy();
});

Then('a screenshot of the account overview is captured as evidence', async function (this: CustomWorld) {
  const pageObject = new AccountNumberMaskingPage(this.page);
  const screenshotPath = await pageObject.captureScreenshot('account-number-visibility');
  await this.attach(screenshotPath, 'text/plain');
  expect(screenshotPath).toContain('account-number-visibility.png');
});
