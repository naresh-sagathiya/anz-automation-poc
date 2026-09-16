/** Shared Playwright actions and assertions used by web page objects. */
import { Locator, Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async click(locator: Locator): Promise<void> {
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async selectOption(locator: Locator, value: string): Promise<void> {
    await locator.selectOption(value);
  }

  async verifyVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async verifyText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  async getText(locator: Locator): Promise<string | null> {
    return await locator.textContent();
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }
}