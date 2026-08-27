import { World, IWorldOptions, setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber';
import dotenv from 'dotenv';
import { chromium, Browser, Page, BrowserContext, devices } from 'playwright';

dotenv.config();
setDefaultTimeout(30000);

const headless = process.env.HEADLESS !== 'false';
const device = process.env.DEVICE || 'iPad';

export class MobileWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize() {
    // Launch a chromium instance with the specified device profile
    this.browser = await chromium.launch({ headless });
    
    // Use device from environment or default device config
    let deviceConfig: any = {
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
    };

    // Use Playwright's built-in device definitions if available
    if (device in devices) {
      deviceConfig = devices[device as keyof typeof devices];
    }

    this.context = await this.browser.newContext(deviceConfig);
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
