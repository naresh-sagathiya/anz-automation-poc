/** Step definitions for login-form and dashboard accessibility journeys. */
import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { AccessibilityJourneyPage } from '../pages/accessibilityJourneyPage';
import { CustomWorld } from '../support/world';

Given('the customer is on the ParaBank login page', async function (this: CustomWorld) {
  const accessibilityPage = new AccessibilityJourneyPage(this.page);
  await accessibilityPage.openLoginPage();
});

Given('the customer navigates to the Accounts Overview page', async function (this: CustomWorld) {
  await this.page.getByRole('link', { name: /Accounts Overview/i }).click();
  await expect(this.page.getByRole('heading', { name: /Accounts Overview/i })).toBeVisible({ timeout: 15000 });
});

Then('the login form should expose visible controls and keyboard targets', async function (this: CustomWorld) {
  const accessibilityPage = new AccessibilityJourneyPage(this.page);
  await accessibilityPage.expectLoginFormAccessible();
});

Then('the dashboard should expose visible navigation and keyboard targets', async function (this: CustomWorld) {
  const accessibilityPage = new AccessibilityJourneyPage(this.page);
  await accessibilityPage.expectDashboardAccessible();
});

