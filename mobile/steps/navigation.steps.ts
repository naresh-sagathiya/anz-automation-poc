import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';
import { MobileAccountOverviewPage } from '../pages/MobileAccountOverviewPage';

When('I select the mobile {string} link', async function (this: MobileWorld, linkName: string) {
  const accountOverview = new MobileAccountOverviewPage(this.page);
  const links = {
    'Transfer Funds': accountOverview.transferFundsLink,
    'Bill Pay': accountOverview.billPayLink,
    'Find Transactions': accountOverview.findTransactionsLink,
    'Request Loan': accountOverview.requestLoanLink,
  } as const;
  const link = links[linkName as keyof typeof links];

  expect(link, `Unsupported mobile navigation link: ${linkName}`).toBeDefined();
  await link.click();
});

Then('the mobile navigation menu is visible', async function (this: MobileWorld) {
  await new MobileAccountOverviewPage(this.page).verifyNavigationMenu();
});

Then('the mobile navigation menu exposes the same functions as desktop', async function (this: MobileWorld) {
  const pageModel = new MobileAccountOverviewPage(this.page);
  await pageModel.verifyNavigationMenu();

  const requiredLabels = [
    'Accounts Overview',
    'Open New Account',
    'Transfer Funds',
    'Bill Pay',
    'Find Transactions',
    'Request Loan',
    'Log Out',
  ];

  for (const label of requiredLabels) {
    const locator = this.page.getByRole('link', { name: label });
    await expect(locator.first()).toBeVisible();
  }
});

Then('the mobile navigation menu presents the key account and transfer actions', async function (this: MobileWorld) {
  const pageModel = new MobileAccountOverviewPage(this.page);
  await pageModel.verifyNavigationMenu();

  await this.page.getByRole('link', { name: 'Transfer Funds' }).first().click();
  await expect(this.page).toHaveURL(/transfer\.htm/);

  await this.page.goto(this.page.url(), { waitUntil: 'domcontentloaded' });
  await expect(this.page.getByRole('link', { name: 'Accounts Overview' }).first()).toBeVisible();
});

Then('the account data remains visible after mobile viewport compression', async function (this: MobileWorld) {
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(1200);

  const visibleSummary = await this.page.evaluate(() => {
    const text = document.body.innerText || '';
    const accountLike = /Accounts Overview|Balance|Available|Total|Checking|Savings/i.test(text);
    const width = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth > width;
    return {
      accountLike,
      overflow,
      textLength: text.trim().length,
      bodyText: text.trim(),
    };
  });

  expect(visibleSummary.accountLike).toBe(true);
  expect(visibleSummary.overflow).toBe(false);
  expect(visibleSummary.textLength).toBeGreaterThan(50);
});

Then('I am on the mobile Transfer Funds page', async function (this: MobileWorld) {
  await expect(this.page).toHaveURL(/transfer\.htm/);
});

Then('I am on the mobile Bill Pay page', async function (this: MobileWorld) {
  await expect(this.page).toHaveURL(/billpay\.htm/);
});

Then('I am on the mobile Find Transactions page', async function (this: MobileWorld) {
  await expect(this.page).toHaveURL(/findtrans\.htm/);
});

Then('I am on the mobile Request Loan page', async function (this: MobileWorld) {
  await expect(this.page).toHaveURL(/requestloan\.htm/);
});

Then('the mobile page has no horizontal scroll', async function (this: MobileWorld) {
  const hasHorizontalScroll = await new MobileAccountOverviewPage(this.page).hasHorizontalScroll();
  expect(hasHorizontalScroll).toBe(false);
});