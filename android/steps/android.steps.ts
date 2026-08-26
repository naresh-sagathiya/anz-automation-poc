import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { AndroidWorld } from '../support/world';

Before(async function (this: AndroidWorld) {
  await this.initialize();
});

After(async function (this: AndroidWorld) {
  await this.dispose();
});

Given('I launch Chrome on the Android emulator', async function (this: AndroidWorld) {
  const driver = this.driver;
  await driver.url('https://parabank.parasoft.com/parabank');
});

Given('I open the ParaBank login page', async function (this: AndroidWorld) {
  const driver = this.driver;
  await driver.url('https://parabank.parasoft.com/parabank');
  await driver.waitUntil(async () => await driver.getUrl().then((url: string) => /parabank/.test(url)), { timeout: 30000 });
});

When('I login with the Android emulator credentials', async function (this: AndroidWorld) {
  const driver = this.driver;
  const username = process.env.PARABANK_USER || 'john';
  const password = process.env.PARABANK_PASS || 'demo';

  const usernameField = await driver.$('input[name="username"]');
  const passwordField = await driver.$('input[name="password"]');
  const loginButton = await driver.$('input[value="Log In"]');

  await usernameField.setValue(username);
  await passwordField.setValue(password);
  await loginButton.click();
});

Then('I should see the account overview page', async function (this: AndroidWorld) {
  const driver = this.driver;
  await driver.waitUntil(async () => await driver.getUrl().then((url: string) => /overview\.htm/.test(url)), { timeout: 30000 });
  const titleText = await driver.getTitle();
  expect(titleText).toContain('ParaBank');
});
