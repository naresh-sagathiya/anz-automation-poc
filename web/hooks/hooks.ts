import { After, Before } from '@cucumber/cucumber';
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { CustomWorld } from '../support/world';
import { TestUtils } from '../../utils/webTestutils';

Before(async function (this: CustomWorld, scenario) {

  // Launch browser
  const browserName = process.env.BROWSER?.toLowerCase();
 
  if (browserName === 'chromium') {
    this.browser = await chromium.launch({headless: false});
  } else if (browserName === 'webkit') {
    this.browser = await webkit.launch({headless: false});
  }else if (browserName === 'firefox') {
    this.browser = await firefox.launch({headless: false});
  } else {
    throw new Error(`Unsupported browser: ${browserName}`);
  }

  // Create browser context
  this.context = await this.browser.newContext();

  // Create page
  this.page = await this.context.newPage();

  // Open ParaBank only if not an MFA test
  if (!scenario.pickle.tags.some(tag => tag.name === '@mfa')) {
    await this.page.goto(process.env.WEB_BASE_URL!);
  }
});

After(async function (this: CustomWorld, scenario) {
  
  // Take a screenshot only when the scenario fails.
  if (scenario.result?.status === 'FAILED' && this.page && !this.page.isClosed()) {
    try {
      const screenshotDir = path.join(process.cwd(), 'tests', 'reports', 'screenshots');
      fs.mkdirSync(screenshotDir, { recursive: true });

      const scenarioName = scenario.pickle.name.replace(/[^a-zA-Z0-9-_]/g, '_');
      const screenshotPath = path.join(screenshotDir, `${scenarioName}.png`);
      const screenshot = await this.page.screenshot({ path: screenshotPath, fullPage: true });

      await this.attach(screenshot, 'image/png');
      console.log(`Failure screenshot saved: ${screenshotPath}`);
    } catch (error) {
      // Screenshot failure should not hide the original test failure.
      console.log('Could not capture failure screenshot:', error);
    }
  }

  // Logout after every scenario.
  if (this.page && !this.page.isClosed()) {
    try {
      await TestUtils.logout(this.page);
    } catch (error) {
      console.log('Logout skipped or failed.');
    }
  }

  if (this.secondaryPage && !this.secondaryPage.isClosed()) {
    try {
      await TestUtils.logout(this.secondaryPage);
    } catch (error) {
      console.log('Secondary logout skipped or failed.');
    }
  }

  if (this.secondaryContext) {
    await this.secondaryContext.close();
  }

  // Close browser context.
  if (this.context) {
    await this.context.close();
  }

  // Close browser.
  if (this.browser) {
    await this.browser.close();
  }
});