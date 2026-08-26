import { Locator, Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async click(locator: Locator) {
    await locator.click();
  }

  async fill(locator: Locator, value: string) {
    await locator.fill(value);
  }

  async selectOption(locator: Locator, value: string) {
    await locator.selectOption(value);
  }

  async verifyVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  async verifyText(locator: Locator, text: string) {
    await expect(locator).toContainText(text);
  }

  async getText(locator: Locator) {
    return await locator.textContent();
  }

  async getTitle() {
    return await this.page.title();
  }

  async getUrl() {
    return this.page.url();
  }
}