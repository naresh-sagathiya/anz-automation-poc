import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';
import { MobileLoginPage } from '../pages/MobileLoginPage';
import { MobileRegistrationData, MobileRegistrationPage } from '../pages/MobileRegistrationPage';

const registrationData: MobileRegistrationData = {
  firstName: 'Mobile',
  lastName: 'Customer',
  address: '101 Test Lane',
  city: 'Sydney',
  state: 'NSW',
  zipCode: '2000',
  phone: '5551234567',
  ssn: '111223333',
  usernamePrefix: 'mobile',
  password: 'Mobile@123',
  confirmPassword: 'Mobile@123',
};

Given('I use the mobile {string} profile', async function (this: MobileWorld, profile: string) {
  if (profile !== 'android' && profile !== 'ios') {
    throw new Error(`Unsupported mobile profile: ${profile}`);
  }
  await this.useProfile(profile);
});

When('I register a new mobile customer', { timeout: 60000 }, async function (this: MobileWorld) {
  const loginPage = new MobileLoginPage(this.page);
  await loginPage.openRegistration();
  await new MobileRegistrationPage(this.page).register(registrationData);
});

Then('mobile registration should complete successfully', async function (this: MobileWorld) {
  await new MobileRegistrationPage(this.page).verifyRegistrationSuccess();
});

Then('the mobile page should have no horizontal scroll', async function (this: MobileWorld) {
  const hasHorizontalScroll = await this.page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);
});

Then('the mobile amount field should support numeric input', async function (this: MobileWorld) {
  await this.page.goto('https://parabank.parasoft.com/parabank/transfer.htm', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  const amount = this.page.locator('#amount');
  await expect(amount).toBeVisible();
  await amount.fill('100.00');
  expect(await amount.inputValue()).toBe('100.00');
  const inputMode = await amount.getAttribute('inputmode');
  const type = await amount.getAttribute('type');
  expect(inputMode === 'decimal' || inputMode === 'numeric' || type === 'number').toBe(true);
});