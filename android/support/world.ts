import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { remote, Browser } from 'webdriverio';

export class AndroidWorld extends World {
  driver!: Browser;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize() {
    this.driver = await remote({
      protocol: 'http',
      hostname: process.env.APPIUM_HOST || '127.0.0.1',
      port: Number(process.env.APPIUM_PORT || 4723),
      path: process.env.APPIUM_PATH || '/wd/hub',
      logLevel: 'error',
      capabilities: {
        platformName: process.env.ANDROID_PLATFORM_NAME || 'Android',
        automationName: process.env.ANDROID_AUTOMATION_NAME || 'UiAutomator2',
        deviceName: process.env.ANDROID_DEVICE_NAME || 'Pixel_10_Pro',
        platformVersion: process.env.ANDROID_PLATFORM_VERSION || '14',
        browserName: 'Chrome',
        noReset: true,
        autoGrantPermissions: true,
      },
    });
  }

  async dispose() {
    if (this.driver) {
      await this.driver.deleteSession();
    }
  }
}

setWorldConstructor(AndroidWorld);
