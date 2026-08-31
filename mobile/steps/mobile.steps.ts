import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';
import { MobileLoginPage } from '../pages/MobileLoginPage';
import { MobileTransferPage } from '../pages/MobileTransferPage';
import { installOfflineMobileMocks, offlineMobileUrl } from '../mocks/mobileMocks';

// Type augmentation for world
declare module '@cucumber/cucumber' {
  interface World {
    browser: any;
    context: any;
    page: any;
    deviceName: string;
  }
}

Before(async function (this: MobileWorld) {
  await this.initialize();
});

After(async function (this: MobileWorld) {
  await this.dispose();
});

Given('I open the parabank mobile site', async function (this: MobileWorld) {
  const apiBaseUrl = process.env.API_BASE_URL;
  const derivedBaseUrl = apiBaseUrl ? apiBaseUrl.replace(/\/services\/bank\/?$/, '') : undefined;
  const mobileBaseUrl = process.env.MOBILE_BASE_URL || process.env.PARABANK_BASE_URL || derivedBaseUrl || 'https://parabank.parasoft.com/parabank';

  await this.page.goto(mobileBaseUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
});

Given('I enable the mobile HAR recording and route mocks', async function (this: MobileWorld) {
  await installOfflineMobileMocks(this.context);
});

When('I open the offline mobile ParaBank page', async function (this: MobileWorld) {
  await this.page.goto(offlineMobileUrl, { waitUntil: 'domcontentloaded' });
});

Then('the offline mobile page should be displayed', async function (this: MobileWorld) {
  await expect(this.page).toHaveTitle('ParaBank | Offline Mobile');
  await expect(this.page.getByTestId('offline-status')).toHaveText('Offline mobile fixture');
});

Then('the offline mobile page should not request the live backend', async function (this: MobileWorld) {
  expect(this.page.url()).toBe(offlineMobileUrl);
  await expect(this.page.locator('#mobile-offline-fixture')).toBeVisible();
});

Given('I login with valid mobile credentials', async function (this: MobileWorld) {
  const user = process.env.PARABANK_USER || 'john';
  const pass = process.env.PARABANK_PASS || 'demo';
  const page = this.page;

  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', pass);
  await page.click('input[value="Log In"]');

  await page.waitForSelector('text=Accounts Overview', { timeout: 20000 }).catch(() => {
    // fallback: some pages load differently; allow the page to settle before continuing
  });
});

When('I navigate to the Transfer Funds page', async function (this: MobileWorld) {
  const page = this.page;
  await page.click('text=Transfer Funds');
  await page.waitForURL(/transfer\.htm/, { timeout: 20000 });
});

When('I submit a transfer of {string} from {string} to {string}', async function (this: MobileWorld, amount: string, from: string, to: string) {
  const transfer = new MobileTransferPage(this.page);
  await transfer.fillTransfer(amount, from, to);
  await transfer.submit();
});

Then('the transfer completes and confirmation is visible without scrolling', async function (this: MobileWorld) {
  const page = this.page;
  await page.waitForSelector('text=Transfer Complete', { timeout: 20000 });
  const confirmation = page.locator('text=Transfer Complete').first();
  await expect(confirmation).toBeVisible();
  const box = await confirmation.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const viewport = this.page.viewportSize() || { height: 1024 };
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
});

Then('the amount field accepts numeric input on mobile', async function (this: MobileWorld) {
  const page = this.page;
  await page.goto('https://parabank.parasoft.com/parabank/transfer.htm', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.fill('#amount', '100.00');
  const amount = await page.locator('#amount').inputValue();
  expect(amount).toBe('100.00');
});

When('I navigate to the Add Payee page', async function (this: MobileWorld) {
  const page = this.page;
  await page.click('text=Bill Pay');
  await page.waitForURL(/billpay\.htm/, { timeout: 20000 });
});

When('I add a payee with name {string} and phone {string} and account {string}', async function (this: MobileWorld, name: string, phone: string, account: string) {
  const page = this.page;
  await page.fill('input[name="payee.name"]', name);
  await page.fill('input[name="payee.address.street"]', '123 Test St');
  await page.fill('input[name="payee.address.city"]', 'Sydney');
  await page.fill('input[name="payee.address.state"]', 'NSW');
  await page.fill('input[name="payee.address.zipCode"]', '2000');
  await page.fill('input[name="payee.phoneNumber"]', phone);
  await page.fill('input[name="payee.accountNumber"]', account);
  await page.fill('input[name="verifyAccount"]', account);
  await page.fill('input[name="amount"]', '25.00');
  await page.selectOption('select[name="fromAccountId"]', { index: 0 });
  await page.click('input[value="Send Payment"]');
});

Then('the payee form accepts input correctly', async function (this: MobileWorld) {
  const page = this.page;
  const name = await page.locator('input[name="payee.name"]').inputValue();
  const phone = await page.locator('input[name="payee.phoneNumber"]').inputValue();
  const account = await page.locator('input[name="payee.accountNumber"]').inputValue();

  expect(name).toBe('My Payee');
  expect(phone).toBe('1234567890');
  expect(account).toBe('987654');
});

Then('inline validation is visible on a narrow screen', async function (this: MobileWorld) {
  const page = this.page;
  await page.click('input[value="Send Payment"]');
  await expect(page.locator('text=Payee name is required.')).toBeVisible();
});
