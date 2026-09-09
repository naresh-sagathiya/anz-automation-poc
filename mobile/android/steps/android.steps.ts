import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { AndroidWorld } from '../support/world';

Before(async function (this: AndroidWorld) {
  await this.initialize();
});

After(async function (this: AndroidWorld) {
  await this.dispose();
});

Given('I launch Chrome on the Android emulator', async function (this: AndroidWorld) {
  const driver = this.driver;
  const url = process.env.ANDROID_PARABANK_URL || 'https://parabank.parasoft.com/parabank';
  await driver.execute('mobile: deepLink', {
    url,
    package: process.env.ANDROID_CHROME_PACKAGE || 'com.android.chrome',
  });
  await driver.pause(5000);
});

Given('I open the ParaBank login page', async function (this: AndroidWorld) {
  const driver = this.driver;
  await driver.$('android=new UiSelector().className("android.webkit.WebView")').waitForDisplayed({ timeout: 30000 });
});

Given('I open the Android ParaBank page {string}', async function (this: AndroidWorld, path: string) {
  const baseUrl = process.env.ANDROID_PARABANK_URL || 'https://parabank.parasoft.com/parabank';
  const url = new URL(path, `${baseUrl.replace(/\/$/, '')}/`).toString();
  await this.driver.execute('mobile: deepLink', {
    url,
    package: process.env.ANDROID_CHROME_PACKAGE || 'com.android.chrome',
  });
});

When('I login with the Android emulator credentials', async function (this: AndroidWorld) {
  const driver = this.driver;
  const username = process.env.PARABANK_USER || 'john';
  const password = process.env.PARABANK_PASS || 'demo';

  const rect = await driver.getWindowRect();
  const width = rect.width;
  const height = rect.height;
  const tap = async (x: number, y: number) => {
    await driver.performActions([{
      type: 'pointer',
      id: 'finger',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerUp', button: 0 },
      ],
    }]);
    await driver.releaseActions();
  };

  // The Chrome WebView exposes its form fields in the hierarchy but not as
  // independently addressable UiAutomator elements on this emulator.
  await tap(Math.floor(width * 0.187), Math.floor(height * 0.518));
  await driver.keys(username);
  await tap(Math.floor(width * 0.187), Math.floor(height * 0.570));
  await driver.keys(password);
  await tap(Math.floor(width * 0.140), Math.floor(height * 0.603));
  await driver.$('android=new UiSelector().textContains("Accounts Overview")').waitForDisplayed({ timeout: 30000 });
});

Then('I should see the account overview page', async function (this: AndroidWorld) {
  const driver = this.driver;
  const pkg = await (driver as any).getCurrentPackage?.();
  expect(pkg).toBe('com.android.chrome');
  await driver.$('android=new UiSelector().textContains("Accounts Overview")').waitForDisplayed({ timeout: 30000 });
});

When('I open the Android mobile navigation link {string}', async function (this: AndroidWorld, linkName: string) {
  await this.driver.$(`android=new UiSelector().text("${linkName}")`).click();
});

Then('the Android mobile page should display {string}', async function (this: AndroidWorld, text: string) {
  await this.driver.$(`android=new UiSelector().textContains("${text}")`).waitForDisplayed({ timeout: 30000 });
});
