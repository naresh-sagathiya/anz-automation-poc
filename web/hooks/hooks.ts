/** Cucumber hooks that create, reset, and close the browser lifecycle for web scenarios. */
import { After, Before } from '@cucumber/cucumber';
import { chromium, firefox, webkit } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';
import { TestUtils } from '../support/webTestutils';

/** Starts the browser, creates the scenario context, and prepares the initial page. */
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

/** Captures failure evidence, logs out, and closes scenario resources. */
After(async function (this: CustomWorld, scenario) {
  
  // Take a screenshot only when the scenario fails.
  if (scenario.result?.status === 'FAILED' && this.page && !this.page.isClosed()) {
    try {
      const scenarioName = scenario.pickle.name;
      const screenshot = await TestUtils.screenshot(this.page, scenarioName);

      await this.attach(screenshot, 'image/png');
      console.log(`Failure screenshot saved: ${TestUtils.screenshotPath(scenarioName)}`);
    } catch (error) {
      // Screenshot failure should not hide the original test failure.
      console.log('Could not capture failure screenshot:', error);
    }
  }

  // Logout after every scenario.
  if (this.page && !this.page.isClosed()) {
    try {
      await new LoginPage(this.page).logout();
    } catch (error) {
      console.log('Logout skipped or failed.');
    }
  }

  if (this.secondaryPage && !this.secondaryPage.isClosed()) {
    try {
      await new LoginPage(this.secondaryPage).logout();
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