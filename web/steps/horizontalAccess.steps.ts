/** Step definitions for verifying account isolation between separate user contexts. */
import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { HorizontalAccessPage } from '../pages/horizontalAccessPage';
import { CustomWorld } from '../support/world';
import { TestUtils } from '../support/webTestutils';
import testData from '../testData/paraBankData.json';

Given('the customer records the first account for horizontal access testing', async function (this: CustomWorld) {
  this.openedAccountId = await new HorizontalAccessPage(this.page).getFirstAccountId();
});

Given('a second user is registered in a separate browser context', async function (this: CustomWorld) {
  this.secondaryContext = await this.browser.newContext();
  this.secondaryPage = await this.secondaryContext.newPage();

  const secondaryUsername = TestUtils.generateUniqueUsername(
    testData.registration.secondaryUsername,
  );
  const secondaryCredentials = await new HorizontalAccessPage(this.secondaryPage).registerUser(
    testData.registration,
    secondaryUsername,
  );
  await expect(this.secondaryPage.getByRole('link', { name: /Log Out/i })).toBeVisible();
  await expect(this.secondaryPage.getByRole('heading', {
    name: `Welcome ${secondaryCredentials.username}`,
  })).toBeVisible();
});

When('the second user attempts to access the first user account data', async function (this: CustomWorld) {
  if (!this.secondaryPage || !this.openedAccountId) {
    throw new Error('The second user context or first user account is missing');
  }

  this.secondaryPageData = await new HorizontalAccessPage(this.secondaryPage)
    .openAccountActivity(this.openedAccountId);
});

Then('the second user should not see the first user account data', async function (this: CustomWorld) {
  if (!this.openedAccountId || this.secondaryPageData === undefined) {
    throw new Error('Horizontal access data was not captured');
  }

  const accountNumberLine = this.secondaryPageData
    .split('\n')
    .find((line) => line.trim().startsWith('Account Number:'));

  expect(accountNumberLine?.trim()).not.toBe(`Account Number:\t${this.openedAccountId}`);
});