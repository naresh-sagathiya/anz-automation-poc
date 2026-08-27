import {Browser,BrowserContext, Page, chromium} from '@playwright/test';

export class BrowserFixture {

  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  async start() {

    const headless = process.env.HEADLESS === 'true';
    this.browser = await chromium.launch({headless});
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

  }

  async stop() {

    if (this.context) {
      await this.context.close();
    }

    if (this.browser) {
      await this.browser.close();
    }
  }
}