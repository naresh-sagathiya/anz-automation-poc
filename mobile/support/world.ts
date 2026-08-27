import { World, IWorldOptions, setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber';
import dotenv from 'dotenv';
import { chromium, Browser, Page, BrowserContext, devices } from 'playwright';

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

  async initialize(profile: 'android' | 'ios' = 'ios') {
    this.browser = await chromium.launch({ headless });
    await this.useProfile(profile);
  }

  async useProfile(profile: 'android' | 'ios'): Promise<void> {
    if (this.context) await this.context.close();
    const device = profile === 'android' ? devices['Pixel 5'] : devices['iPhone 12'];
    this.context = await this.browser.newContext({ ...device });
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
