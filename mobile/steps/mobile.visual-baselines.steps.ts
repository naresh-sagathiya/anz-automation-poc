import { Then, When } from '@cucumber/cucumber';
import { expect, Page } from '@playwright/test';
import { MobileWorld } from '../support/world';
import { MobileLoginPage } from '../pages/MobileLoginPage';

function dynamicContent(page: Page) {
  return [
    page.locator('#accountTable, #transactionTable'),
    page.locator('#accountTable td:nth-child(2), #accountTable td:nth-child(3)'),
    page.locator('#accountTable tfoot td'),
    page.locator('#transactionTable td:first-child'),
  ];
}

async function loginToDashboard(page: Page): Promise<void> {
  const loginPage = new MobileLoginPage(page);
  await loginPage.open();

  const username = process.env.PARABANK_USER || 'john';
  const password = process.env.PARABANK_PASS || 'demo';

  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[value="Log In"]').click();

  await page.waitForURL(/overview\.htm/, { timeout: 10000 });
}

When('I capture the mobile dashboard visual baseline', async function (this: MobileWorld) {
  await loginToDashboard(this.page);

  await expect(this.page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    mask: dynamicContent(this.page),
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03,
    timeout: 10000,
  });
});

When('I capture the mobile transfer visual baseline', async function (this: MobileWorld) {
  await loginToDashboard(this.page);
  await this.page.getByRole('link', { name: 'Transfer Funds' }).click();
  await expect(this.page).toHaveURL(/transfer\.htm/);

  await expect(this.page).toHaveScreenshot('transfer.png', {
    fullPage: true,
    mask: dynamicContent(this.page),
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03,
    timeout: 10000,
  });
});

Then('the mobile visual baselines should match for the {string} device', async function (this: MobileWorld, profile: string) {
  expect(['android', 'ios']).toContain(profile);
  await expect(this.page.locator('body')).toBeVisible();
});
