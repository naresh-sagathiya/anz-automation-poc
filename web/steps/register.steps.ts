/** Step definitions for customer registration and post-registration logout. */
import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/registerPage';
import testData from '../testData/paraBankData.json';

When('the customer registers a new user using registration test data', async function (this: CustomWorld) {
  console.log('Starting registration...');

  const loginPage = new LoginPage(this.page);
  await loginPage.openRegistration();

  const registerPage = new RegisterPage(this.page);
  this.registeredCredentials = await registerPage.register(testData.registration);
  await expect(this.page.getByRole('link', { name: /Log Out/i })).toBeVisible();

  console.log('Registration form submitted successfully');
});

Given('the customer logs out after registration', async function (this: CustomWorld) {
  const logoutLink = this.page.getByRole('link', { name: /Log Out/i });

  await expect(logoutLink).toBeVisible();
  await logoutLink.click();
  await expect(this.page.locator('input[value="Log In"]')).toBeVisible();
});

Then('the customer registration should be successful', async function (this: CustomWorld) {
  await expect(this.page.locator('h1.title')).toContainText('Welcome');

  const credentials = this.registeredCredentials;
  if (!credentials) {
    throw new Error('Registered credentials were not captured');
  }

  console.log(`Registration successful for ${credentials.username}.`);
});