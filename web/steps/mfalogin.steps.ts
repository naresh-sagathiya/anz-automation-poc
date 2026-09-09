/** Step definitions for GitHub MFA login, OTP entry, and authentication errors. */
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { generateOTP, InvalidOTP } from '../support/otpUtils';
import { MFAPage } from '../pages/MFAPage';


Given('the user is on the MFA login page', { timeout: 30000 }, async function () {
  const mfaPage = new MFAPage(this.page);
  await mfaPage.PreReq();
  await this.page.goto(process.env.MFA_BASE_URL!);
});

When('the user logs in with valid GitHub credentials', { timeout: 30_000 }, async function () {
  const mfaPage = new MFAPage(this.page);
  await mfaPage.login(process.env.GITHUB_USER!, process.env.GITHUB_PASS!);
});

When('the user enters a valid OTP', { timeout: 30_000 }, async function () {
  const mfaPage = new MFAPage(this.page);
  const validCode = generateOTP(process.env.GITHUB_MFA_SECRET!);
  await mfaPage.EnterOTP(validCode);
});

Then('the user should be successfully authenticated', { timeout: 30_000 }, async function () {
  // Verify successful login by checking if we're redirected away from MFA page
  await expect(this.page).not.toHaveURL(/.*\/login.*/);
});

When('the user enters an invalid OTP', { timeout: 30_000 }, async function () {
  const mfaPage = new MFAPage(this.page);
  const invalidCode = InvalidOTP(process.env.GITHUB_MFA_SECRET!);
  await mfaPage.EnterInvalidOTP(invalidCode);
});

Then('the user should see an authentication error message', { timeout: 30_000 }, async function () {
  await expect(this.page.getByText('Two-factor authentication failed.', { exact: true })).toBeVisible({ timeout: 10000 });
});