import { World, IWorldOptions, setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber';
setDefaultTimeout(60000);
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
      path: process.env.APPIUM_PATH || '/',
      logLevel: 'error',
      capabilities: {
        platformName: process.env.ANDROID_PLATFORM_NAME || 'Android',
        // Use native app automation instead of browserName to avoid requiring Chromedriver
        'appium:automationName': process.env.ANDROID_AUTOMATION_NAME || 'UiAutomator2',
        'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Pixel_10_Pro',
        'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '14',
        // Launch Chrome as a native app by package/activity
        'appium:appPackage': process.env.ANDROID_CHROME_PACKAGE || 'com.android.chrome',
        'appium:appActivity': process.env.ANDROID_CHROME_ACTIVITY || 'com.google.android.apps.chrome.Main',
        'appium:noReset': true,
        'appium:autoGrantPermissions': true,
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
