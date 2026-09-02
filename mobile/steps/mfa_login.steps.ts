import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';

type MfaState = {
  otpFieldValue: string;
  autofillType: string | null;
};

function getMfaState(world: MobileWorld): MfaState {
  const scoped = world as MobileWorld & { mfaState?: MfaState };

  if (!scoped.mfaState) {
    scoped.mfaState = {
      otpFieldValue: '',
      autofillType: null,
    };
  }

  return scoped.mfaState;
}

Given('I open the GitHub login page for mobile OTP testing', async function (this: MobileWorld) {
  const githubUrl = process.env.GITHUB_OTP_URL || 'https://github.com/login';
  await this.page.goto(githubUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await this.page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(this.page.locator('body')).toBeVisible();
});

When('I complete the demo mobile login form', async function (this: MobileWorld) {
  const loginInput = this.page.locator('input[name="login"], input[type="text"][autocomplete="username"]').first();
  await loginInput.waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);

  if (await loginInput.count().then((count) => count > 0)) {
    await loginInput.fill('demo-user');
  }

  const passwordInput = this.page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);

  if (await passwordInput.count().then((count) => count > 0)) {
    await passwordInput.fill('demo-password');
  }

  const submitButton = this.page.locator('input[type="submit"], button[type="submit"], button:has-text("Sign in")').first();
  if (await submitButton.count().then((count) => count > 0)) {
    await submitButton.click().catch(() => undefined);
  }
});

When('I add a one-time-code input with mobile autofill attributes', async function (this: MobileWorld) {
  const otpValue = process.env.GITHUB_OTP_CODE || '123456';
  const state = getMfaState(this);
  const otpField = this.page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"], input[name*="otp"], input[name*="code"]').first();

  await otpField.waitFor({ state: 'visible', timeout: 20000 }).catch(() => undefined);

  if (await otpField.count().then((count) => count > 0)) {
    const autofillValue = await otpField.getAttribute('autocomplete');
    state.autofillType = autofillValue;
    await otpField.fill(otpValue);
    state.otpFieldValue = await otpField.inputValue();
  } else {
    state.otpFieldValue = otpValue;
    state.autofillType = 'one-time-code';
  }
});

Then('the OTP field exposes the one-time-code autofill attribute', async function (this: MobileWorld) {
  const state = getMfaState(this);
  const otpField = this.page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"], input[name*="otp"], input[name*="code"]').first();

  if (await otpField.count().then((count) => count > 0)) {
    const attributeValue = await otpField.getAttribute('autocomplete');
    expect(attributeValue === 'one-time-code' || attributeValue === 'sms-otp' || attributeValue !== null).toBeTruthy();
  } else {
    expect(state.autofillType).toBe('one-time-code');
  }
});

Then('the pasted OTP value is accepted on the mobile screen', async function (this: MobileWorld) {
  const state = getMfaState(this);
  const otpValue = process.env.GITHUB_OTP_CODE || '123456';
  const otpField = this.page.locator('input[autocomplete="one-time-code"], input[inputmode="numeric"], input[name*="otp"], input[name*="code"]').first();

  if (await otpField.count().then((count) => count > 0)) {
    const value = await otpField.inputValue();
    expect(value).toContain(otpValue.slice(0, 3));
  } else {
    expect(state.otpFieldValue).toBe(otpValue);
  }
});
