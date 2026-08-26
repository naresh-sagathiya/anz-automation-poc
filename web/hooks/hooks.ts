import { After, Before } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { CustomWorld } from '../support/world';
import { TestUtils } from '../../utils/webTestutils';

Before(async function (this: CustomWorld) {

  // Launch browser
  this.browser = await chromium.launch({ headless: false });

  // Create browser context
  this.context = await this.browser.newContext();

  // Create page
  this.page = await this.context.newPage();

  // Open ParaBank
  await this.page.goto(process.env.BASE_URL!);
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

  // Close browser context.
  if (this.context) {
    await this.context.close();
  }

  // Close browser.
  if (this.browser) {
    await this.browser.close();
  }
});