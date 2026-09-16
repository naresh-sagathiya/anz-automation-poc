import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const port = Number(process.env.APPIUM_PORT || 4723);
const appiumCommand = process.platform === 'win32' ? process.execPath : 'appium';
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

function stop(child: ChildProcess | undefined): void {
  if (child && !child.killed) {
    child.kill();
  }
}

async function run(): Promise<void> {
  appium = spawn(appiumCommand, [...appiumArgs, '--port', String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });

  const startupError = new Promise<never>((_, reject) => {
    appium?.once('error', (error) => {
      reject(new Error(`Unable to start Appium: ${error.message}`));
    });
  });
  await Promise.race([waitForPort(), startupError]);

  cucumber = spawn(cucumberCommand, ['--profile', 'android', ...process.argv.slice(2)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      APPIUM_PORT: String(port),
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
    windowsHide: true,
  });

  await new Promise<void>((resolve, reject) => {
    cucumber?.once('error', reject);
    cucumber?.once('exit', (code, signal) => {
      stop(appium);
      if (signal) {
        reject(new Error(`Android Cucumber process terminated by ${signal}`));
        return;
      }
      process.exitCode = code ?? 1;
      resolve();
    });
  });
}

run().catch((error: Error) => {
  stop(cucumber);
  stop(appium);
  console.error(error.message);
  process.exitCode = 1;
});

process.once('SIGINT', () => {
  stop(cucumber);
  stop(appium);
  process.exitCode = 130;
});
