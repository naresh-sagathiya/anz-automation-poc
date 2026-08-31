import { remote } from 'webdriverio';
import 'dotenv/config';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PARABANK_URL =
  process.env.PARABANK_BASE_URL ||
  'https://parabank.parasoft.com/parabank/index.htm';
const USERNAME = process.env.PARABANK_USER || 'john';
const PASSWORD = process.env.PARABANK_PASS || 'demo';

async function logDiagnostics(driver: Awaited<ReturnType<typeof remote>>, label: string): Promise<void> {
  const currentUrl = await driver.getUrl();
  const title = await driver.getTitle();
  const pageSource = await driver.getPageSource();

  console.log(`\n=== ${label} ===`);
  console.log(`URL: ${currentUrl}`);
  console.log(`Title: ${title}`);

  const sourceSnippet = pageSource
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1800);

  console.log(`Page source snippet: ${sourceSnippet}`);
}

async function takeScreenshot(driver: Awaited<ReturnType<typeof remote>>, name: string): Promise<void> {
  await driver.takeScreenshot();
  console.log(`Screenshot captured: ${name}.png`);
}

async function assertLoginElementState(
  driver: Awaited<ReturnType<typeof remote>>,
  locator: string,
  elementName: string
): Promise<void> {
  const element = await driver.$(locator);
  await element.waitForDisplayed({ timeout: 20000 });
  const isDisplayed = await element.isDisplayed();
  const isEnabled = await element.isEnabled();

  console.log(`${elementName} displayed=${isDisplayed} enabled=${isEnabled}`);

  if (!isDisplayed || !isEnabled) {
    throw new Error(`${elementName} is not visible or not enabled.`);
  }
}

async function verifyPostLoginLinks(driver: Awaited<ReturnType<typeof remote>>): Promise<void> {
  const checks = [
    'Accounts Overview',
    'Open New Account',
    'Transfer Funds',
    'Log Out'
  ];

  for (const text of checks) {
    const match = await driver.$(`//a[contains(normalize-space(.), '${text}')]`);
    const exists = await match.waitForExist({ timeout: 15000 }).then(() => true).catch(() => false);
    console.log(`${text} link present: ${exists}`);
    if (!exists) {
      throw new Error(`Expected post-login link not found: ${text}`);
    }
  }
}

async function runParaBankCheck(config: {
  label: string;
  platformName: string;
  browserName: string;
  deviceName: string;
  osVersion: string;
}): Promise<void> {
  const driver = await remote({
    hostname: 'hub-cloud.browserstack.com',
    port: 443,
    protocol: 'https',
    path: '/wd/hub',
    capabilities: {
      platformName: config.platformName,
      browserName: config.browserName,
      'bstack:options': {
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        deviceName: config.deviceName,
        osVersion: config.osVersion,
        projectName: 'ANZ Mobile POC',
        buildName: 'Build-1',
        sessionName: `ParaBank Login - ${config.label}`
      }
    }
  });

  try {
    console.log(`\n===== Starting ${config.label} session =====`);
    console.log(`Target URL: ${PARABANK_URL}`);
    console.log(`Credentials: username=${USERNAME}, password=${PASSWORD}`);

    await driver.url(PARABANK_URL);
    await driver.pause(4000);
    await logDiagnostics(driver, `${config.label} after page load`);

    const usernameField = await driver.$('input[name="username"]');
    const passwordField = await driver.$('input[name="password"]');
    const loginButton = await driver.$('input[value="Log In"], input[type="submit"]');

    await usernameField.waitForExist({ timeout: 20000 });
    await passwordField.waitForExist({ timeout: 20000 });
    await loginButton.waitForExist({ timeout: 20000 });

    await assertLoginElementState(driver, 'input[name="username"]', 'Username');
    await assertLoginElementState(driver, 'input[name="password"]', 'Password');
    await assertLoginElementState(driver, 'input[value="Log In"], input[type="submit"]', 'Login button');

    await usernameField.clearValue();
    await usernameField.setValue(USERNAME);
    await passwordField.clearValue();
    await passwordField.setValue(PASSWORD);

    console.log('Form values set.');
    console.log('Username value=', await usernameField.getValue());
    console.log('Password value length=', (await passwordField.getValue()).length);

    await takeScreenshot(driver, `${config.label}-before-login`);

    for (const step of [
      { name: 'regular click', action: async () => loginButton.click() },
      {
        name: 'javascript click',
        action: async () => {
          await driver.execute(() => {
            const element = document.querySelector('input[value="Log In"], input[type="submit"]') as HTMLInputElement | null;
            if (element) {
              element.click();
            }
          });
        }
      },
      {
        name: 'form submit',
        action: async () => {
          await driver.execute(() => {
            const form = document.forms.namedItem('login') || document.querySelector('form');
            if (form) {
              if (typeof (form as HTMLFormElement).requestSubmit === 'function') {
                (form as HTMLFormElement).requestSubmit();
              } else {
                (form as HTMLFormElement).submit();
              }
            }
          });
        }
      },
      {
        name: 'Enter key',
        action: async () => {
          await passwordField.click();
          await driver.keys('Enter');
        }
      }
    ]) {
      console.log(`\nAttempting ${config.label}: ${step.name}`);
      try {
        await step.action();
      } catch (error) {
        console.warn(`Submit step failed for ${config.label} - ${step.name}:`, error);
      }

      await driver.pause(3000);
      const currentUrl = await driver.getUrl();
      console.log(`${config.label} current URL after ${step.name}: ${currentUrl}`);

      if (currentUrl.includes('overview.htm')) {
        console.log(`✅ ${config.label} login successful`);
        await verifyPostLoginLinks(driver);
        await takeScreenshot(driver, `${config.label}-after-login-success`);
        return;
      }
    }

    const finalUrl = await driver.getUrl();
    const finalTitle = await driver.getTitle();
    const pageSource = await driver.getPageSource();

    console.log(`\n=== ${config.label} login result ===`);
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Final title: ${finalTitle}`);

    if (pageSource.includes('The username and password could not be verified')) {
      console.log(`${config.label}: invalid credentials rejected by ParaBank.`);
    } else if (finalUrl.includes('index.htm')) {
      console.log(`${config.label}: form click/submit did not trigger navigation.`);
    } else {
      console.log(`${config.label}: login state not confirmed; inspect page source.`);
    }

    await takeScreenshot(driver, `${config.label}-after-login-failure`);
  } finally {
    await driver.pause(3000);
    await driver.deleteSession();
    console.log(`Session closed for ${config.label}`);
  }
}

(async () => {
  const configs = [
    {
      label: 'Android',
      platformName: 'Android',
      browserName: 'Chrome',
      deviceName: 'Google Pixel 7',
      osVersion: '13.0'
    },
    {
      label: 'iPhone',
      platformName: 'iOS',
      browserName: 'Safari',
      deviceName: 'iPhone 14',
      osVersion: '16'
    }
  ];

  await Promise.all(configs.map((config) => runParaBankCheck(config)));
  console.log('All BrowserStack sessions completed.');
})();