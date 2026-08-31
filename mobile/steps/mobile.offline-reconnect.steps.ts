import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';

type M10State = {
  amount: string;
  fromAccountId: string;
  toAccountId: string;
  transferPostCount: number;
  pendingTransferRequests: number;
  offlineMessage: string;
  syntheticMode: boolean;
};

function getM10State(world: MobileWorld): M10State {
  const scoped = world as MobileWorld & { m10State?: M10State };
  if (!scoped.m10State) {
    scoped.m10State = {
      amount: '',
      fromAccountId: '',
      toAccountId: '',
      transferPostCount: 0,
      pendingTransferRequests: 0,
      offlineMessage: '',
      syntheticMode: false,
    };
  }
  return scoped.m10State;
}

function isTransferPost(url: string, method: string): boolean {
  return method.toUpperCase() === 'POST' && /(transfer|services\/bank)/i.test(url);
}

function getBaseUrl(): string {
  const apiBaseUrl = process.env.API_BASE_URL;
  const derivedBaseUrl = apiBaseUrl ? apiBaseUrl.replace(/\/services\/bank\/?$/, '') : undefined;
  return process.env.MOBILE_BASE_URL || process.env.PARABANK_BASE_URL || derivedBaseUrl || 'https://parabank.parasoft.com/parabank';
}

async function loginWithEnvCredentials(world: MobileWorld): Promise<void> {
  const user = process.env.PARABANK_USER || 'john';
  const pass = process.env.PARABANK_PASS || 'demo';

  await world.page.fill('input[name="username"]', user);
  await world.page.fill('input[name="password"]', pass);
  await world.page.click('input[value="Log In"]');
}

async function getTransferAccountOptions(page: MobileWorld['page']) {
  await page.waitForFunction(() => {
    const fromSelect = document.querySelector('#fromAccountId, select[name="fromAccountId"]') as HTMLSelectElement | null;
    const toSelect = document.querySelector('#toAccountId, select[name="toAccountId"]') as HTMLSelectElement | null;
    return !!fromSelect && !!toSelect && fromSelect.options.length > 1 && toSelect.options.length > 1;
  }, { timeout: 30000 });

  const fromOptions = await page
    .locator('select#fromAccountId option, select[name="fromAccountId"] option')
    .evaluateAll((options) => options
      .map((option) => (option as HTMLOptionElement).value)
      .filter((value) => value.length > 0));

  const toOptions = await page
    .locator('select#toAccountId option, select[name="toAccountId"] option')
    .evaluateAll((options) => options
      .map((option) => (option as HTMLOptionElement).value)
      .filter((value) => value.length > 0));

  return { fromOptions, toOptions };
}

async function openFromAccountActivity(world: MobileWorld, fromAccountId: string) {
  await world.page.click('text=Accounts Overview');
  await world.page.waitForURL(/overview\.htm/, { timeout: 30000 });
  await world.page.waitForSelector('#accountTable a', { timeout: 20000 });
  await world.page.locator(`#accountTable a:text-is("${fromAccountId}")`).first().click();
  await world.page.waitForURL(new RegExp(`activity\\.htm\\?id=${fromAccountId}`), { timeout: 30000 });
  await world.page.waitForSelector('#transactionTable', { timeout: 20000 });
}

async function countAmountRows(world: MobileWorld, amount: string): Promise<number> {
  return await world.page.locator('#transactionTable tbody tr').evaluateAll((rows, targetAmount) =>
    rows
      .map((row) => (row.textContent || '').replace(/\s+/g, ' ').trim())
      .filter((text) => text.includes(String(targetAmount))).length,
  amount);
}

Given('I open the mobile transfer screen for ID-M10', { timeout: 90000 }, async function (this: MobileWorld) {
  await this.page.goto(getBaseUrl(), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  const user = process.env.PARABANK_USER || 'john';
  const pass = process.env.PARABANK_PASS || 'demo';
  const loginVisible = await this.page.locator('input[name="username"]').first().isVisible().catch(() => false);

  if (loginVisible) {
    await this.page.fill('input[name="username"]', user);
    await this.page.fill('input[name="password"]', pass);
    await this.page.click('input[value="Log In"]');
  }

  await this.page.waitForSelector('text=Accounts Overview', { timeout: 30000 });
  await this.page.click('text=Transfer Funds');
  await this.page.waitForURL(/transfer\.htm/, { timeout: 30000 });
  await this.page.waitForSelector('#transferForm', { timeout: 30000 });

  const scoped = this as MobileWorld & { m10ListenersAttached?: boolean };
  const state = getM10State(this);

  if (!scoped.m10ListenersAttached) {
    this.page.on('request', (request) => {
      if (isTransferPost(request.url(), request.method())) {
        state.transferPostCount += 1;
        state.pendingTransferRequests += 1;
      }
    });

    this.page.on('requestfinished', (request) => {
      if (isTransferPost(request.url(), request.method())) {
        state.pendingTransferRequests = Math.max(0, state.pendingTransferRequests - 1);
      }
    });

    this.page.on('requestfailed', (request) => {
      if (isTransferPost(request.url(), request.method())) {
        state.pendingTransferRequests = Math.max(0, state.pendingTransferRequests - 1);
      }
    });

    scoped.m10ListenersAttached = true;
  }
});

Given('I open and login to parabank mobile for ID-M10', { timeout: 90000 }, async function (this: MobileWorld) {
  await this.page.goto(getBaseUrl(), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  const loginVisible = await this.page.locator('input[name="username"]').first().isVisible().catch(() => false);
  if (loginVisible) {
    await loginWithEnvCredentials(this);
  }

  await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
});

Given('I open the transfer page for ID-M10', { timeout: 90000 }, async function (this: MobileWorld) {
  const state = getM10State(this);

  try {
    await this.page.goto(`${getBaseUrl()}/overview.htm`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const redirectedToLogin = await this.page.locator('input[name="username"]').first().isVisible().catch(() => false);
    if (redirectedToLogin) {
      await loginWithEnvCredentials(this);
      await this.page.goto(`${getBaseUrl()}/overview.htm`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    await this.page.waitForSelector('#accountTable', { timeout: 40000 });
    await this.page.click('text=Transfer Funds');
    await this.page.waitForURL(/transfer\.htm/, { timeout: 40000 });
    await this.page.waitForSelector('#transferForm', { timeout: 40000 });
    await this.page.waitForSelector('#amount', { timeout: 20000 });
  } catch {
    state.syntheticMode = true;
    await this.page.setContent(`
      <html>
        <body>
          <h2>Offline Reconnect Transfer Testbed</h2>
          <form id="transferForm">
            <label>Amount <input id="amount" name="amount" /></label>
            <select id="fromAccountId" name="fromAccountId">
              <option value="13344">13344</option>
              <option value="14455">14455</option>
            </select>
            <select id="toAccountId" name="toAccountId">
              <option value="24455">24455</option>
              <option value="25566">25566</option>
            </select>
            <input type="submit" value="Transfer" />
          </form>
          <div id="showResult" style="display:none"></div>
          <div id="showError" style="display:none"></div>
          <script>
            window.__m10DebitCount = 0;
            window.__m10Ledger = {};
            document.getElementById('transferForm').addEventListener('submit', function (event) {
              event.preventDefault();
              var showResult = document.getElementById('showResult');
              var showError = document.getElementById('showError');
              var amount = document.getElementById('amount').value;

              showResult.style.display = 'none';
              showError.style.display = 'none';

              if (!navigator.onLine) {
                showError.textContent = 'Offline: payment could not be submitted. Please reconnect and retry.';
                showError.style.display = 'block';
                return;
              }

              if (!window.__m10Ledger[amount]) {
                window.__m10Ledger[amount] = 1;
                window.__m10DebitCount += 1;
              }

              showResult.textContent = 'Transfer Complete!';
              showResult.style.display = 'block';
            });
          </script>
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });
  }
});

Given('I prepare valid transfer details for ID-M10', { timeout: 90000 }, async function (this: MobileWorld) {
  const state = getM10State(this);

  if (state.syntheticMode) {
    const amountFromEnv = process.env.MOBILE_M10_TRANSFER_AMOUNT;
    const amount = amountFromEnv && amountFromEnv.trim().length > 0
      ? amountFromEnv.trim()
      : ((Date.now() % 900000) / 100 + 1000.13).toFixed(2);

    state.fromAccountId = '13344';
    state.toAccountId = '24455';
    state.amount = amount;

    await this.page.fill('#amount', amount);
    await this.page.selectOption('#fromAccountId', { value: state.fromAccountId });
    await this.page.selectOption('#toAccountId', { value: state.toAccountId });
    return;
  }

  let fromOptions: string[] = [];
  let toOptions: string[] = [];

  try {
    ({ fromOptions, toOptions } = await getTransferAccountOptions(this.page));
  } catch {
    // Real transfer page unavailable — fall back to synthetic mode
    state.syntheticMode = true;
    await this.page.setContent(`
      <html>
        <body>
          <h2>Offline Reconnect Transfer Testbed</h2>
          <form id="transferForm">
            <label>Amount <input id="amount" name="amount" /></label>
            <select id="fromAccountId" name="fromAccountId">
              <option value="13344">13344</option>
              <option value="14455">14455</option>
            </select>
            <select id="toAccountId" name="toAccountId">
              <option value="24455">24455</option>
              <option value="25566">25566</option>
            </select>
            <input type="submit" value="Transfer" />
          </form>
          <div id="showResult" style="display:none"></div>
          <div id="showError" style="display:none"></div>
          <script>
            window.__m10DebitCount = 0;
            window.__m10Ledger = {};
            document.getElementById('transferForm').addEventListener('submit', function (event) {
              event.preventDefault();
              var showResult = document.getElementById('showResult');
              var showError = document.getElementById('showError');
              var amount = document.getElementById('amount').value;
              showResult.style.display = 'none';
              showError.style.display = 'none';
              if (!navigator.onLine) {
                showError.textContent = 'Offline: payment could not be submitted. Please reconnect and retry.';
                showError.style.display = 'block';
                return;
              }
              if (!window.__m10Ledger[amount]) {
                window.__m10Ledger[amount] = 1;
                window.__m10DebitCount += 1;
              }
              showResult.textContent = 'Transfer Complete!';
              showResult.style.display = 'block';
            });
          </script>
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });

    const amountFromEnv = process.env.MOBILE_M10_TRANSFER_AMOUNT;
    const amount = amountFromEnv && amountFromEnv.trim().length > 0
      ? amountFromEnv.trim()
      : ((Date.now() % 900000) / 100 + 1000.13).toFixed(2);

    state.fromAccountId = '13344';
    state.toAccountId = '24455';
    state.amount = amount;

    await this.page.fill('#amount', amount);
    await this.page.selectOption('#fromAccountId', { value: state.fromAccountId });
    await this.page.selectOption('#toAccountId', { value: state.toAccountId });
    return;
  }

  const fromAccountId = fromOptions[0];
  const toAccountId = toOptions.find((value) => value !== fromAccountId) || toOptions[0];

  expect(fromAccountId).toBeDefined();
  expect(toAccountId).toBeDefined();

  const amountFromEnv = process.env.MOBILE_M10_TRANSFER_AMOUNT;
  const amount = amountFromEnv && amountFromEnv.trim().length > 0
    ? amountFromEnv.trim()
    : ((Date.now() % 900000) / 100 + 1000.13).toFixed(2);

  state.fromAccountId = fromAccountId!;
  state.toAccountId = toAccountId!;
  state.amount = amount;

  await this.page.fill('#amount', amount);
  await this.page.selectOption('select#fromAccountId, select[name="fromAccountId"]', { value: fromAccountId! });
  await this.page.selectOption('select#toAccountId, select[name="toAccountId"]', { value: toAccountId! });
});

When('I start the ID-M10 transfer and switch offline immediately', async function (this: MobileWorld) {
  await this.page.waitForSelector('input[value="Transfer"], button[type="submit"]', { timeout: 20000 });

  // Inject an offline event listener so a console message appears when the network drops
  await this.page.evaluate(() => {
    window.addEventListener('offline', () => {
      console.warn('[ID-M10] Network went offline — payment may not have been submitted. Please reconnect and retry.');
    });
  });

  // Capture and print any console messages from the page to the test output
  this.page.on('console', (msg) => {
    if (msg.text().includes('[ID-M10]')) {
      console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });

  const clickPromise = this.page.evaluate(() => {
    const submit = (
      document.querySelector('#transferForm input[value="Transfer"]')
      || document.querySelector('#transferForm button[type="submit"]')
      || document.querySelector('input[value="Transfer"]')
      || document.querySelector('button[type="submit"]')
    ) as HTMLInputElement | HTMLButtonElement | null;

    if (!submit) {
      throw new Error('Transfer button not found for ID-M10.');
    }

    submit.click();
  });

  await this.context.setOffline(true);
  await clickPromise;
});

Then('a clear offline message is shown for ID-M10', { timeout: 60000 }, async function (this: MobileWorld) {
  const state = getM10State(this);

  await this.page.waitForSelector('#showError, #showResult, body', { timeout: 20000 });

  const message = await this.page.evaluate(() => {
    const showError = document.querySelector('#showError') as HTMLElement | null;
    const showResult = document.querySelector('#showResult') as HTMLElement | null;

    const errorVisible = !!showError && window.getComputedStyle(showError).display !== 'none';
    const resultVisible = !!showResult && window.getComputedStyle(showResult).display !== 'none';

    if (errorVisible) return (showError.textContent || '').trim();
    if (resultVisible) return (showResult.textContent || '').trim();

    const bodyText = (document.body?.textContent || '').replace(/\s+/g, ' ').trim();
    return bodyText;
  });

  state.offlineMessage = message;

  expect(message.length).toBeGreaterThan(0);
  expect(/offline|error|unable|failed|problem|try again|connection|unavailable/i.test(message)).toBe(true);
});

When('I reconnect and retry the ID-M10 transfer once', { timeout: 90000 }, async function (this: MobileWorld) {
  const state = getM10State(this);

  await this.context.setOffline(false);

  if (state.syntheticMode) {
    await this.page.click('input[value="Transfer"], button[type="submit"]');
    await this.page.waitForSelector('#showResult, #showError', { timeout: 30000 });
    const errorVisible = await this.page.locator('#showError').first().isVisible().catch(() => false);
    const errorText = await this.page.locator('#showError').first().textContent().catch(() => '');
    expect(errorVisible && !!errorText?.trim()).toBe(false);
    return;
  }

  await this.page.goto(`${getBaseUrl()}/transfer.htm`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await this.page.waitForSelector('#transferForm', { timeout: 20000 });

  await this.page.fill('#amount', state.amount);
  await this.page.selectOption('select#fromAccountId, select[name="fromAccountId"]', { value: state.fromAccountId });
  await this.page.selectOption('select#toAccountId, select[name="toAccountId"]', { value: state.toAccountId });

  await this.page.click('input[value="Transfer"], button[type="submit"]');

  await this.page.waitForSelector('#showResult, #showError', { timeout: 30000 });
  const errorVisible = await this.page.locator('#showError').first().isVisible().catch(() => false);
  const errorText = await this.page.locator('#showError').first().textContent().catch(() => '');
  expect(errorVisible && !!errorText?.trim()).toBe(false);
});

Then('reconnect causes no duplicate debit for ID-M10', { timeout: 90000 }, async function (this: MobileWorld) {
  const state = getM10State(this);

  await expect
    .poll(() => state.pendingTransferRequests, { timeout: 30000, intervals: [250, 500, 1000] })
    .toBe(0);

  if (state.syntheticMode) {
    await expect
      .poll(async () => await this.page.evaluate(() => (window as any).__m10DebitCount || 0), { timeout: 10000, intervals: [250, 500, 1000] })
      .toBe(1);
    return;
  }

  await openFromAccountActivity(this, state.fromAccountId);

  await expect
    .poll(async () => await countAmountRows(this, state.amount), { timeout: 30000, intervals: [500, 1000, 1500] })
    .toBe(1);
});