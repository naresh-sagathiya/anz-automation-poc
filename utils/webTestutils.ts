import {Page,expect} from '@playwright/test';

export class TestUtils {

  static async waitForPageLoad(page: Page) {

    await page.waitForLoadState('domcontentloaded');
  }

  static async isVisible(locator: any): Promise<boolean> {

    return await locator.isVisible().catch(() => false);
  }

  static async logout(page: Page) {

    const logoutLink = page.getByRole('link', {name: /log out/i});

    if ( await this.isVisible(logoutLink)) {

      await logoutLink.click();
      await expect(page.locator('input[value="Log In"]')).toBeVisible();
    }
  }

  static async screenshot(page: Page,name: string) {

    const fileName =name.replace( /[^a-zA-Z0-9]/g, '_');

    return await page.screenshot({
      path: `tests/reports/${fileName}.png`, fullPage: true
    });
  }

  static generateUniqueUsername(prefix: string) {

    return `${prefix}${Date.now()}`;
  }
}