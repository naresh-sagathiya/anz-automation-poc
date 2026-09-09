/** Common navigation and page-visibility steps shared by web scenarios. */
import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('the customer is on the ParaBank home page', async function (this: CustomWorld) {
  await expect(this.page).toHaveTitle(/ParaBank/i);
});

Then('the customer page should be displayed', async function (this: CustomWorld) {
  await expect(this.page).toHaveTitle(/ParaBank/i);
});