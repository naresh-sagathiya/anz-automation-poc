import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

type DeviceDefinition = {
  deviceName: string;
  udid: string;
  platformVersion: string;
  appiumPort: string;
};

const definitions: DeviceDefinition[] = (process.env.ANDROID_DEVICES ||
  'Pixel_10_Pro:emulator-5554:17:4723,Pixel_10_Pro_Fold:emulator-5556:16:4725,Pixel_6:emulator-5558:17:4727')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => {
    const [deviceName, udid, platformVersion, appiumPort] = value.split(':');
    if (!deviceName || !udid || !platformVersion || !appiumPort) {
      throw new Error(`Invalid device definition "${value}". Expected name:udid:androidVersion:appiumPort`);
    }
    return { deviceName, udid, platformVersion, appiumPort };
  });

const dryRun = process.argv.includes('--dry-run');
const command = process.platform === 'win32' ? 'appium.cmd' : 'appium';
const cucumber = process.platform === 'win32'
  ? path.join(process.cwd(), 'node_modules', '.bin', 'cucumber-js.cmd')
  : path.join(process.cwd(), 'node_modules', '.bin', 'cucumber-js');
const profile = process.env.ANDROID_CUCUMBER_PROFILE || 'android';
const children: ReturnType<typeof spawn>[] = [];

function startProcess(file: string, args: string[], env: Record<string, string> = {}) {
  const child = spawn(file, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
  children.push(child);
  return child;
}

function stopProcesses() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

function waitForPort(port: number, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const attempt = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start >= timeoutMs) {
          reject(new Error(`Appium did not start on port ${port} within ${timeoutMs}ms`));
        } else {
          setTimeout(attempt, 250);
        }
      });
    };
    attempt();
  });
}

async function run() {
  if (!dryRun) {
    for (const device of definitions) {
      startProcess(command, ['--port', device.appiumPort], {});
    }
    await Promise.all(definitions.map((device) => waitForPort(Number(device.appiumPort))));
  }

  const testProcesses = definitions.map((device) =>
    startProcess(cucumber, ['--profile', profile, ...process.argv.slice(2)], {
      ANDROID_DEVICE_NAME: device.deviceName,
      ANDROID_UDID: device.udid,
      ANDROID_PLATFORM_VERSION: device.platformVersion,
      APPIUM_PORT: device.appiumPort,
    }),
  );

  let remaining = testProcesses.length;
  let exitCode = 0;
  for (const child of testProcesses) {
    child.on('exit', (code) => {
      exitCode = Math.max(exitCode, code ?? 0);
      remaining -= 1;
      if (remaining === 0) {
        stopProcesses();
        process.exit(exitCode);
      }
    });
  }
}

run().catch((error: Error) => {
  stopProcesses();
  console.error(error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  stopProcesses();
  process.exit(130);
});
