/** Shared browser and test-data utilities for web scenarios. */
import fs from 'fs';
import path from 'path';
import {Page} from '@playwright/test';

export class TestUtils {

  /** Waits until the document structure is available for interaction. */
  static async waitForPageLoad(page: Page) {

    await page.waitForLoadState('domcontentloaded');
  }

  /** Checks visibility without failing when the locator is detached or missing. */
  static async isVisible(locator: any): Promise<boolean> {

    return await locator.isVisible().catch(() => false);
  }

  /** Captures a full-page screenshot in the web report directory. */
  static async screenshot(page: Page,name: string) {

    const screenshotPath = this.screenshotPath(name);
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

    return await page.screenshot({
      path: screenshotPath, fullPage: true
    });
  }

  /** Builds a sanitized, stable screenshot path from a display name. */
  static screenshotPath(name: string) {

    const fileName = name.replace(/[^a-zA-Z0-9-_]/g, '_');

    return path.join(process.cwd(), 'reports', 'web', 'screenshots', `${fileName}.png`);
  }

  /** Creates a unique username suitable for registration test data. */
  static generateUniqueUsername(prefix: string) {

    return `${prefix}${Date.now()}`;
  }
}
