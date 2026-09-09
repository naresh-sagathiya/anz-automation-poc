/** Step definitions for valid ParaBank login and account-overview navigation. */
import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CustomWorld } from '../support/world';

When('the customer logs in to ParaBank using valid credentials', { timeout: 15_000 }, async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);

  const credentials = this.registeredCredentials;

  if (!credentials) {
    throw new Error('Registered credentials are missing. Add account registration to the feature Background.');
  }

  await this.page.goto(process.env.WEB_BASE_URL!);
  await loginPage.login(credentials.username, credentials.password);
});

Then('the customer should see the Accounts Overview page', async function (this: CustomWorld) {
  await expect(this.page.getByRole('heading', { name: /Accounts Overview/i })).toBeVisible();
});