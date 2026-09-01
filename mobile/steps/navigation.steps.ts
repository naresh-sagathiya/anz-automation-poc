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