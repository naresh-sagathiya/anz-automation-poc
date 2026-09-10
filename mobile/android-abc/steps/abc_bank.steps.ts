import { After, Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TOTP } from 'otpauth';
import { MyBankingAndroidWorld } from '../../android-mybanking/support/world';

Before(async function (this: MyBankingAndroidWorld) {
  await this.initialize();
});

After(async function (this: MyBankingAndroidWorld) {
  if (process.env.ABC_KEEP_APP_OPEN !== 'true') {
    await this.dispose();
  }
});

Given('I launch ABC Bank', async function (this: MyBankingAndroidWorld) {
  await this.driver.waitUntil(
    async () => (await this.driver.getCurrentActivity()).endsWith('MainActivity'),
    { timeout: 30000, timeoutMsg: 'ABC Bank MainActivity did not become active' },
  );
});

When('I enter the ABC Bank credentials', async function (this: MyBankingAndroidWorld) {
  const username = process.env.ABC_USERNAME;
  const password = process.env.ABC_PASSWORD;
  if (!username || !password) {
    throw new Error('Set ABC_USERNAME and ABC_PASSWORD before running the ABC Bank login scenario');
  }

  const usernameField = this.driver.$('id=com.app.hemanthbank:id/edit_identifier');
  const passwordField = this.driver.$('id=com.app.hemanthbank:id/edit_password');

  await usernameField.waitForDisplayed({ timeout: 10000 });
  await usernameField.setValue(username);
  await passwordField.waitForDisplayed({ timeout: 10000 });
  await passwordField.setValue(password);
});

When('I click the ABC Bank login button', async function (this: MyBankingAndroidWorld) {
  await this.driver.$('id=com.app.hemanthbank:id/button_login').click();
});

When('I enter the ABC Bank verification code', async function (this: MyBankingAndroidWorld) {
  const verificationCode = process.env.ABC_TOTP_SECRET
    ? new TOTP({ secret: process.env.ABC_TOTP_SECRET }).generate()
    : process.env.ABC_VERIFICATION_CODE;
  if (!verificationCode) {
    throw new Error(
      'Set ABC_TOTP_SECRET for automatic code generation or ABC_VERIFICATION_CODE for a manual code',
    );
  }

  const codeField = this.driver.$('id=com.app.hemanthbank:id/edit_code');
  await codeField.waitForDisplayed({ timeout: 15000 });
  await codeField.setValue(verificationCode);
});

When('I click the ABC Bank verify button', async function (this: MyBankingAndroidWorld) {
  await this.driver.$('id=com.app.hemanthbank:id/button_verify').click();
});

Then('the ABC Bank main activity should be displayed', async function (this: MyBankingAndroidWorld) {
  assert.equal(await this.driver.getCurrentPackage(), 'com.app.hemanthbank');
  assert.equal(await this.driver.getCurrentActivity(), '.MainActivity');
});

Then('ABC Bank should remain active after login submission', async function (this: MyBankingAndroidWorld) {
  await this.driver.waitUntil(
    async () => (await this.driver.getCurrentPackage()) === 'com.app.hemanthbank',
    { timeout: 10000, timeoutMsg: 'ABC Bank was not active after login submission' },
  );
});

Then('the ABC Bank verification screen should be displayed', async function (this: MyBankingAndroidWorld) {
  await this.driver.$('id=com.app.hemanthbank:id/edit_code').waitForDisplayed({ timeout: 15000 });
  await this.driver.$('id=com.app.hemanthbank:id/button_verify').waitForDisplayed({ timeout: 10000 });
});

When('I enter the verification code manually in the emulator', { timeout: 120000 }, async function (
  this: MyBankingAndroidWorld,
) {
  const codeField = this.driver.$('id=com.app.hemanthbank:id/edit_code');
  const verifyButton = this.driver.$('id=com.app.hemanthbank:id/button_verify');

  await codeField.waitForDisplayed({ timeout: 15000 });
  await this.driver.waitUntil(
    async () => /^\d{6}$/.test(await codeField.getValue()),
    { timeout: 120000, timeoutMsg: 'Enter a six-digit verification code in the emulator' },
  );
  await verifyButton.click();
});

Then('ABC Bank should remain active after verification', async function (this: MyBankingAndroidWorld) {
  await this.driver.waitUntil(
    async () => (await this.driver.getCurrentPackage()) === 'com.app.hemanthbank',
    { timeout: 10000, timeoutMsg: 'ABC Bank was not active after verification' },
  );
});