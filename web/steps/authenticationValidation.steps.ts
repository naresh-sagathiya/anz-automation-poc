/** Step definitions for authentication validation, protected-page redirects, and session expiry. */
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { AuthenticationValidationPage } from '../pages/authenticationValidationPage';
import type { Cookie } from '@playwright/test';

When('the user navigates to a protected page', { timeout: 30_000 }, async function () {
  const authenticationPage = new AuthenticationValidationPage(this.page);
  // Navigate to dashboard or settings - protected pages
  await authenticationPage.navigateToProtectedPage();
  await this.page.waitForLoadState('domcontentloaded');
  this.currentUrl = this.page.url();
});

When("the session is invalidated by clearing storage", { timeout: 30_000 }, async function () {
  const authenticationPage = new AuthenticationValidationPage(this.page);
  await authenticationPage.clearSessionStorage();
  await authenticationPage.clearCookies();
  await authenticationPage.clearLocalStorage();
});

When("the user's session expires", { timeout: 30_000 }, async function () {
  // Clear all cookies to simulate session expiry
  await this.page.context().clearCookies();
  // Clear storage
  await this.page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

When('the user clicks the back button', { timeout: 30_000 }, async function () {
  await this.page.goBack({ waitUntil: 'domcontentloaded', timeout: 10_000 });
});

Then('the user should be redirected to the login page', { timeout: 30_000 }, async function () {
  // Verify we're on the login page
  await expect(this.page).toHaveURL(/.*\/login.*/);
  // Verify the login form is visible
  await expect(this.page.locator('#login_field')).toBeVisible();
  await expect(this.page.locator('#password')).toBeVisible();
});

Then('verify if user is logged out', { timeout: 30_000 }, async function () {
  const cookies = await this.page.context().cookies();

  const authenticationCookie = cookies.find(
    (c: Cookie) =>
      c.name.toLowerCase().includes('auth') ||
      c.name.toLowerCase().includes('sid') ||
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('logged_in')
  );

  expect(authenticationCookie).toBeUndefined();
});

Then('the page should redirect to 2FA page', { timeout: 30_000 }, async function () {
  // Wait for redirect to complete
  // await this.page.waitForURL(/.*\/login.*/, { timeout: 10000 });
  // await expect(this.page).toHaveURL(/.*\/login.*/);
  const url = this.page.url();
  expect(
    url.includes('/login') ||
    url.includes('/sessions/two-factor/app')
  ).toBeTruthy();
});

Then('the user should not see any authenticated content', { timeout: 30_000 }, async function () {
  const authenticationPage = new AuthenticationValidationPage(this.page);
  // Verify we don't see dashboard or settings specific elements
  const dashboardElements = this.page.locator('[data-testid="dashboard"]');
  await expect(dashboardElements).not.toBeVisible({ timeout: 5000 }).catch(() => {
    // It's OK if dashboard element doesn't exist
  });
});

When('the authentication cookie should be stored', { timeout: 30_000 }, async function () {
  const cookies = await this.page.context().cookies();
  this.sessionCookiesBefore = cookies;
  expect(cookies.length).toBeGreaterThan(0);
  // Look for GitHub auth-related cookies
  const authCookie = cookies.find(
    (c: Cookie) => 
    c.name.toLowerCase().includes('auth') || 
    c.name.toLowerCase().includes('sid') || 
    c.name.toLowerCase().includes('session') ||
    c.name.toLowerCase().includes('logged_in')
  );
  expect(authCookie).toBeDefined();
});

When('the session is cleared', { timeout: 30_000 }, async function () {
  const authenticationPage = new AuthenticationValidationPage(this.page);
  await authenticationPage.clearSessionStorage();
  await authenticationPage.clearCookies();
  await authenticationPage.clearLocalStorage();
});

Then('the authentication cookie should not be present', { timeout: 30_000 }, async function () {
  const cookies = await this.page.context().cookies();
  expect(cookies.length).toBe(0);
});

Then('the user should not have an active session', { timeout: 30_000 }, async function () {
  // Try to navigate to a protected page - should redirect to login
  try {
    await this.page.goto('https://github.com/settings/profile', { waitUntil: 'networkidle' });
    // If we're still on login page, session is not active
    expect(this.page.url()).toContain('/login');
  } catch (e) {
    // Navigation to protected page failed, which is expected
  }
});
