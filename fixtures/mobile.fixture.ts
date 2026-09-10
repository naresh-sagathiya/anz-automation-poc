import { test as base } from '@playwright/test';
import { MobileAccountOverviewPage } from '../mobile/pages/MobileAccountOverviewPage';
import { MobileLoginPage } from '../mobile/pages/MobileLoginPage';

type MobileFixtures = {
  mobileLoginPage: MobileLoginPage;
  mobileAccountOverviewPage: MobileAccountOverviewPage;
};

export const test = base.extend<MobileFixtures>({
  mobileLoginPage: async ({ page }, use) => {
    await use(new MobileLoginPage(page));
  },
  mobileAccountOverviewPage: async ({ page }, use) => {
    await use(new MobileAccountOverviewPage(page));
  },
});

export { expect } from '@playwright/test';
