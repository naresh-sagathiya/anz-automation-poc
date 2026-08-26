import { World, IWorldOptions, setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber';
import dotenv from 'dotenv';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

dotenv.config();
setDefaultTimeout(30000);

const headless = process.env.HEADLESS !== 'false';

export class MobileWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize() {
    // Launch a chromium instance suitable for mobile testing (iPad-like viewport)
    this.browser = await chromium.launch({ headless });
    this.context = await this.browser.newContext({
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
    });
    this.page = await this.context.newPage();
  }

  async dispose() {
    try {
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (e) {
      // ignore
    }
  }
}

setWorldConstructor(MobileWorld);
