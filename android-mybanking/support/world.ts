import { IWorldOptions, World, setDefaultTimeout, setWorldConstructor } from '@cucumber/cucumber';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Browser, remote } from 'webdriverio';

setDefaultTimeout(90000);

export class MyBankingAndroidWorld extends World {
  driver!: Browser;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async initialize(): Promise<void> {
    const appPath = resolve(process.env.ANDROID_APP_PATH || 'apps/MyBankingApp.apk');
    if (!existsSync(appPath)) {
      throw new Error(`MyBankingApp APK was not found at "${appPath}". Set ANDROID_APP_PATH to a local APK.`);
    }
    const capabilities: Record<string, unknown> = {
      platformName: 'Android',
      'appium:automationName': process.env.ANDROID_AUTOMATION_NAME || 'UiAutomator2',
      'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Pixel_10_Pro',
      'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '14',
      ...(process.env.ANDROID_UDID ? { 'appium:udid': process.env.ANDROID_UDID } : {}),
      'appium:app': appPath,
      'appium:appPackage': process.env.ANDROID_APP_PACKAGE || 'com.mybankingapp',
      'appium:appActivity': process.env.ANDROID_APP_ACTIVITY || 'com.mybankingapp.MainActivity',
      'appium:appWaitActivity': process.env.ANDROID_APP_WAIT_ACTIVITY || 'com.mybankingapp.MainActivity',
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:newCommandTimeout': 120,
      'appium:uiautomator2ServerLaunchTimeout': Number(process.env.ANDROID_UIAUTOMATOR2_SERVER_LAUNCH_TIMEOUT || 120000),
      'appium:adbExecTimeout': Number(process.env.ANDROID_ADB_EXEC_TIMEOUT || 120000),
    };

    this.driver = await remote({
      protocol: 'http',
      hostname: process.env.APPIUM_HOST || '127.0.0.1',
      port: Number(process.env.APPIUM_PORT || 4723),
      path: process.env.APPIUM_PATH || '/',
      logLevel: 'error',
      capabilities,
    });
  }

  async dispose(): Promise<void> {
    if (this.driver) {
      await this.driver.deleteSession();
    }
  }
}

setWorldConstructor(MyBankingAndroidWorld);
