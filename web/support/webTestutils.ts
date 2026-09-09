import fs from 'fs';
import path from 'path';
import {Page} from '@playwright/test';

export class TestUtils {

  static async waitForPageLoad(page: Page) {

    await page.waitForLoadState('domcontentloaded');
  }

  static async isVisible(locator: any): Promise<boolean> {

    return await locator.isVisible().catch(() => false);
  }

  static async screenshot(page: Page,name: string) {

    const screenshotPath = this.screenshotPath(name);
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

    return await page.screenshot({
      path: screenshotPath, fullPage: true
    });
  }

  static screenshotPath(name: string) {

    const fileName = name.replace(/[^a-zA-Z0-9-_]/g, '_');

    return path.join(process.cwd(), 'reports', 'web', 'screenshots', `${fileName}.png`);
  }

  static generateUniqueUsername(prefix: string) {

    return `${prefix}${Date.now()}`;
  }
}
