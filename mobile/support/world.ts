import { World, IWorldOptions, setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber';
import dotenv from 'dotenv';
import { chromium, Browser, Page, BrowserContext, devices } from 'playwright';

dotenv.config();
setDefaultTimeout(30000);

const headless = process.env.HEADLESS !== 'false';
const launchSlowMo = Number.parseInt(process.env.MOBILE_SLOWMO_MS || process.env.PW_SLOWMO_MS || '0', 10);
const keepOpenMs = Number.parseInt(process.env.MOBILE_KEEP_OPEN_MS || '0', 10);
const configuredDevices = (process.env.MOBILE_DEVICES || process.env.DEVICE || 'iPad')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

export class MobileWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  deviceName!: string;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize(profile?: 'android' | 'ios') {
    // Launch a chromium instance suitable for mobile testing (iPad-like viewport)
    this.browser = await chromium.launch({
      headless,
      slowMo: Number.isFinite(launchSlowMo) && launchSlowMo > 0 ? launchSlowMo : 0,
    });
    await this.useProfile(profile);
  }

  async useProfile(profile?: 'android' | 'ios'): Promise<void> {
    if (this.context) await this.context.close();
    const workerId = Number.parseInt(process.env.CUCUMBER_WORKER_ID || '0', 10);
    const deviceIndex = Number.isNaN(workerId) ? 0 : workerId % configuredDevices.length;
    const configuredDevice = configuredDevices[deviceIndex];
    const profileDevice = profile === 'android' ? 'Pixel 5' : profile === 'ios' ? 'iPhone 12' : configuredDevice;
    this.deviceName = profileDevice;
    const deviceConfig = profileDevice in devices
      ? devices[profileDevice as keyof typeof devices]
      : {
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
      };
    this.context = await this.browser.newContext(deviceConfig);
    this.page = await this.context.newPage();
  }

  async dispose() {
    try {
      if (keepOpenMs > 0 && this.page) {
        await this.page.waitForTimeout(keepOpenMs);
      }
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (e) {
      // ignore
    }
  }
}

setWorldConstructor(MobileWorld);
