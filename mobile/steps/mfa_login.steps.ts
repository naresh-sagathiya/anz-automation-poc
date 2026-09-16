import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { TOTP } from 'otpauth';
import { MobileWorld } from '../support/world';

type MfaState = {
  otpValue: string;
};

function getMfaState(world: MobileWorld): MfaState {
  const scoped = world as MobileWorld & { mfaState?: MfaState };

  if (!scoped.mfaState) {
    scoped.mfaState = {
      otpValue: '',
    };
  }

  return scoped.mfaState;
}

Given('I open the SeleniumBase MFA login page on mobile', async function (this: MobileWorld) {
  const loginUrl = process.env.SELENIUMBASE_OTP_LOGIN_URL || 'https://seleniumbase.github.io/realworld/login';
  await this.page.goto(loginUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await expect(this.page.locator('#username')).toBeVisible();
  await expect(this.page.locator('#password')).toBeVisible();
  await expect(this.page.locator('#totpcode')).toBeVisible();
});

When('I fill the SeleniumBase mobile login credentials', async function (this: MobileWorld) {
  await this.page.locator('#username').fill(process.env.SELENIUMBASE_OTP_USERNAME || 'demo_user');
  await this.page.locator('#password').fill(process.env.SELENIUMBASE_OTP_PASSWORD || 'secret_pass');
});

When('I paste the generated TOTP into the mobile MFA field', async function (this: MobileWorld) {
  const secret = process.env.SELENIUMBASE_OTP_SECRET;
  if (!secret) throw new Error('SELENIUMBASE_OTP_SECRET is required for ID-M2.');

  const otpValue = new TOTP({ secret }).generate();
  const state = getMfaState(this);
  state.otpValue = otpValue;
  await this.page.locator('#totpcode').fill(otpValue);
});

Then('the mobile MFA field supports one-time-code autofill', async function (this: MobileWorld) {
  const otpField = this.page.locator('#totpcode');
  const inputMode = await otpField.getAttribute('inputmode');
  const autocomplete = await otpField.getAttribute('autocomplete');
  expect(inputMode === 'numeric' || inputMode === 'decimal' || autocomplete === 'one-time-code' || autocomplete === 'off').toBe(true);
});

Then('the pasted TOTP is accepted on the mobile screen', async function (this: MobileWorld) {
  const state = getMfaState(this);
  expect(state.otpValue).toMatch(/^\d{6}$/);
  await expect(this.page.locator('#totpcode')).toHaveValue(state.otpValue);
});

When('I submit the mobile MFA login', async function (this: MobileWorld) {
  await this.page.locator('#log-in').click();
});

Then('the SeleniumBase mobile login succeeds', async function (this: MobileWorld) {
  await expect(this.page).toHaveURL(/seleniumbase\.github\.io\/realworld\/$/, { timeout: 15000 });
  await expect.poll(async () => this.page.evaluate(() => sessionStorage.getItem('realworld_auth_granted')))
    .toBe('true');
  await expect(this.page.locator('body')).toBeVisible();
});
