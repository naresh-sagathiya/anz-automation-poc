import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BillPayDetails, BillPayPage } from '../pages/billPayPage';
import { CustomWorld } from '../support/world';
import billPayData from '../test_data/paraBankData.json';

const details = billPayData.billPay as BillPayDetails;

Given('the customer navigates to Bill Pay', async function (this: CustomWorld) {
  const billPayPage = new BillPayPage(this.page);
  await billPayPage.open();
});

When('the customer submits the bill payment using test data', async function (this: CustomWorld) {
  const billPayPage = new BillPayPage(this.page);
  await billPayPage.fillPayment(details);
  await billPayPage.submitPayment();
});

When('the customer submits a bill payment with amount {string}', async function (this: CustomWorld, amount: string) {
  const billPayPage = new BillPayPage(this.page);
  await billPayPage.fillPayment(details, amount);
  await billPayPage.submitPayment();
});

When('the customer submits a bill payment without a payee name', async function (this: CustomWorld) {
  await new BillPayPage(this.page).submitMissingPayeeName(details);
});

When('the customer submits a bill payment with mismatched account confirmation', async function (this: CustomWorld) {
  await new BillPayPage(this.page).submitMismatchedAccount(details);
});

When('the customer submits the same bill payment twice', async function (this: CustomWorld) {
  const billPayPage = new BillPayPage(this.page);
  await billPayPage.fillPayment(details);
  await billPayPage.submitPaymentTwice();
});

Then('the bill payment should be completed successfully', async function (this: CustomWorld) {
  await new BillPayPage(this.page).expectPaymentComplete();
});

Then('the bill payment should be rejected with an error', async function (this: CustomWorld) {
  await new BillPayPage(this.page).expectPaymentError();
});
