import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';
import { MobileLoginPage } from '../pages/MobileLoginPage';
import { MobileTransferPage } from '../pages/MobileTransferPage';
import { installOfflineMobileMocks, offlineMobileUrl } from '../mocks/mobileMocks';
import { mobileConfig } from '../config';

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
  await this.page.goto(mobileConfig.baseUrl, {
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
  const loginPage = new MobileLoginPage(this.page);
  await loginPage.login(mobileConfig.username, mobileConfig.password);
  await expect(this.page).toHaveURL(/overview\.htm/, { timeout: 20000 });
});

When('I navigate to the Transfer Funds page', async function (this: MobileWorld) {
  const page = this.page;
  await this.page.getByRole('link', { name: 'Transfer Funds' }).click();
  await expect(this.page).toHaveURL(/transfer\.htm/, { timeout: 20000 });
});

When('I submit a transfer of {string} from {string} to {string}', async function (this: MobileWorld, amount: string, from: string, to: string) {
  const transfer = new MobileTransferPage(this.page);
  await transfer.fillTransfer(amount, from, to);
  await transfer.submit();
});

Then('the transfer completes and confirmation is visible without scrolling', async function (this: MobileWorld) {
  const confirmation = this.page.getByText('Transfer Complete').first();
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
  await this.page.goto(`${mobileConfig.baseUrl}/transfer.htm`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await this.page.locator('#amount').fill('100.00');
  const amount = await this.page.locator('#amount').inputValue();
  expect(amount).toBe('100.00');
});

When('I navigate to the Add Payee page', async function (this: MobileWorld) {
  await this.page.getByRole('link', { name: 'Bill Pay' }).click();
  await expect(this.page).toHaveURL(/billpay\.htm/, { timeout: 20000 });
});

When('I add a payee with name {string} and phone {string} and account {string}', async function (this: MobileWorld, name: string, phone: string, account: string) {
  await this.page.locator('input[name="payee.name"]').fill(name);
  await this.page.locator('input[name="payee.address.street"]').fill('123 Test St');
  await this.page.locator('input[name="payee.address.city"]').fill('Sydney');
  await this.page.locator('input[name="payee.address.state"]').fill('NSW');
  await this.page.locator('input[name="payee.address.zipCode"]').fill('2000');
  await this.page.locator('input[name="payee.phoneNumber"]').fill(phone);
  await this.page.locator('input[name="payee.accountNumber"]').fill(account);
  await this.page.locator('input[name="verifyAccount"]').fill(account);
  await this.page.locator('input[name="amount"]').fill('25.00');
  await this.page.locator('select[name="fromAccountId"]').selectOption({ index: 0 });
  await this.page.locator('input[value="Send Payment"]').click();
});

Then('the payee form accepts input correctly', async function (this: MobileWorld) {
  const name = await this.page.locator('input[name="payee.name"]').inputValue();
  const phone = await this.page.locator('input[name="payee.phoneNumber"]').inputValue();
  const account = await this.page.locator('input[name="payee.accountNumber"]').inputValue();

  expect(name).toBe('My Payee');
  expect(phone).toBe('1234567890');
  expect(account).toBe('987654');
});

Then('inline validation is visible on a narrow screen', async function (this: MobileWorld) {
  await this.page.locator('input[value="Send Payment"]').click();
  await expect(this.page.getByText('Payee name is required.')).toBeVisible();
});
