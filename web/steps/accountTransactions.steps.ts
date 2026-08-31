import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { AccountActivityPage } from '../pages/accountActivityPage';
import { AccountOverviewPage } from '../pages/accountOverviewPage';
import { BillPayDetails, BillPayPage } from '../pages/billPayPage';
import { FindTransactionsPage } from '../pages/findTransactionsPage';
import { CustomWorld } from '../support/world';
import testData from '../test_data/paraBankData.json';

const billPayDetails = testData.billPay as BillPayDetails;

When('the customer records the first account balance', async function (this: CustomWorld) {
  const overview = new AccountOverviewPage(this.page);
  await overview.open();
  this.openedAccountId = await overview.getFirstAccountId();
  this.initialBalance = await overview.getBalance(this.openedAccountId);
});

When('the customer opens the first account from Accounts Overview', async function (this: CustomWorld) {
  const overview = new AccountOverviewPage(this.page);
  await overview.open();
  if (!this.openedAccountId) {
    this.openedAccountId = await overview.getFirstAccountId();
  }
  await new AccountActivityPage(this.page).open(this.openedAccountId);
});

Then('the account balance should reconcile across the overview and statement', async function (this: CustomWorld) {
  if (!this.openedAccountId || this.initialBalance === undefined) {
    throw new Error('The initial account balance was not captured');
  }
  const activity = new AccountActivityPage(this.page);
  const detailBalance = await activity.getAccountDetailBalance();
  const calculatedBalance = await activity.calculateBalance(this.initialBalance);
  expect(detailBalance).toBeCloseTo(calculatedBalance, 2);
});

When('the customer searches the first account transactions for amount {string}', async function (this: CustomWorld, amount: string) {
  if (!this.openedAccountId) {
    const overview = new AccountOverviewPage(this.page);
    await overview.open();
    this.openedAccountId = await overview.getFirstAccountId();
  }
  const findTransactions = new FindTransactionsPage(this.page);
  await findTransactions.open(this.openedAccountId);
  await findTransactions.searchByAmount(amount);
});

Then('every transaction result should match amount {string}', async function (this: CustomWorld, amount: string) {
  const results = await new FindTransactionsPage(this.page).getResultAmounts();
  expect(results.length).toBeGreaterThan(0);
  expect(results.every((value) => value === Number(amount))).toBeTruthy();
});