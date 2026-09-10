import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const port = Number(process.env.APPIUM_PORT || 4735);
const abcEnvironment = {
  ANDROID_APP_PATH: 'apps/ABCbank.apk',
  ANDROID_DEVICE_NAME: process.env.ANDROID_DEVICE_NAME || 'sdk_gphone16k_x86_64',
  ANDROID_PLATFORM_VERSION: process.env.ANDROID_PLATFORM_VERSION || '17',
  ANDROID_UDID: process.env.ANDROID_UDID || 'emulator-5554',
  ANDROID_APP_PACKAGE: 'com.app.hemanthbank',
  ANDROID_APP_ACTIVITY: 'com.app.hemanthbank.MainActivity',
  ANDROID_APP_WAIT_ACTIVITY: 'com.app.hemanthbank.MainActivity',
};
const appiumCommand = process.platform === 'win32'
  ? process.execPath
  : 'appium';
const appiumArgs = process.platform === 'win32'
  ? [path.join(process.cwd(), 'node_modules', 'appium', 'index.js')]
  : [];
const cucumberCommand = process.platform === 'win32'
  ? path.join(process.cwd(), 'node_modules', '.bin', 'cucumber-js.cmd')
  : path.join(process.cwd(), 'node_modules', '.bin', 'cucumber-js');

let appium: ChildProcess | undefined;
let cucumber: ChildProcess | undefined;

function waitForPort(timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Appium did not start on port ${port} within ${timeoutMs}ms`));
          return;
        }
        setTimeout(check, 250);
      });
    };
    check();
  });
}

function stopProcess(child: ChildProcess | undefined): void {
  if (child && !child.killed) {
    child.kill();
  }
}

function stopAppium(): void {
  stopProcess(appium);
}

async function run(): Promise<void> {
  appium = spawn(appiumCommand, [...appiumArgs, '--port', String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });

  const appiumStartupError = new Promise<never>((_, reject) => {
    appium?.once('error', (error) => {
      reject(new Error(`Unable to start Appium: ${error.message}`));
    });
  });

  await Promise.race([waitForPort(), appiumStartupError]);

  cucumber = spawn(cucumberCommand, ['--profile', 'android-abc', '--tags', '@login'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...abcEnvironment,
      APPIUM_PORT: String(port),
      HEADLESS: 'false',
      ABC_KEEP_APP_OPEN: 'true',
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
    windowsHide: true,
  });

  await new Promise<void>((resolve, reject) => {
    cucumber?.once('error', reject);
    cucumber?.once('exit', (code, signal) => {
      stopAppium();
      if (signal) {
        reject(new Error(`ABC Cucumber process terminated by ${signal}`));
        return;
      }
      process.exitCode = code ?? 1;
      resolve();
    });
  });
}

run().catch((error: Error) => {
  stopProcess(cucumber);
  stopAppium();
  console.error(error.message);
  process.exitCode = 1;
});

process.once('SIGINT', () => {
  stopProcess(cucumber);
  stopAppium();
  process.exitCode = 130;
});
