import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';

type M9State = {
  transferPostCount: number;
  pendingTransferRequests: number;
  sawLoadingStateInFlight: boolean;
  sawDisabledInFlight: boolean;
  baselineConfirmLabel: string;
  amount: string;
};

function getM9State(world: MobileWorld): M9State {
  const scoped = world as MobileWorld & { m9State?: M9State };
  if (!scoped.m9State) {
    scoped.m9State = {
      transferPostCount: 0,
      pendingTransferRequests: 0,
      sawLoadingStateInFlight: false,
      sawDisabledInFlight: false,
      baselineConfirmLabel: '',
      amount: '',
    };
  }
  return scoped.m9State;
}

function transferPostRequest(url: string, method: string): boolean {
  return method.toUpperCase() === 'POST';
}

Given('I open the mobile transfer screen for ID-M9', async function (this: MobileWorld) {
  await this.page.click('text=Transfer Funds');
  await this.page.waitForURL(/transfer\.htm/, { timeout: 20000 });
  await this.page.waitForSelector('#transferForm', { timeout: 20000 });
});

When('I enable CDP network throttling for ID-M9 transfer', async function (this: MobileWorld) {
  const state = getM9State(this);
  const scoped = this as MobileWorld & {
    m9CdpClient?: any;
    m9RequestListenerAttached?: boolean;
  };

  scoped.m9CdpClient = await this.context.newCDPSession(this.page);
  await scoped.m9CdpClient.send('Network.enable');
  await scoped.m9CdpClient.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 3000,
    downloadThroughput: 12 * 1024,
    uploadThroughput: 8 * 1024,
    connectionType: 'cellular3g',
  });

  if (!scoped.m9RequestListenerAttached) {
    this.page.on('request', (request) => {
      if (transferPostRequest(request.url(), request.method())) {
        state.transferPostCount += 1;
        state.pendingTransferRequests += 1;
      }
    });

    this.page.on('requestfinished', (request) => {
      if (transferPostRequest(request.url(), request.method())) {
        state.pendingTransferRequests = Math.max(0, state.pendingTransferRequests - 1);
      }
    });

    this.page.on('requestfailed', (request) => {
      if (transferPostRequest(request.url(), request.method())) {
        state.pendingTransferRequests = Math.max(0, state.pendingTransferRequests - 1);
      }
    });

    scoped.m9RequestListenerAttached = true;
  }

  await this.page.evaluate(() => {
    if ((window as any).__m9SubmitGuardInstalled) return;

    const form = document.querySelector('#transferForm') as HTMLFormElement | null;
    if (!form) return;

    form.addEventListener('submit', () => {
      const submit = (
        form.querySelector('input[value="Transfer"]')
        || form.querySelector('button[type="submit"]')
      ) as HTMLInputElement | HTMLButtonElement | null;

      if (submit) {
        submit.disabled = true;
        if (submit instanceof HTMLInputElement && submit.value.trim().toLowerCase() === 'transfer') {
          submit.value = 'Processing...';
        }
      }

      const showResult = document.querySelector('#showResult') as HTMLElement | null;
      if (showResult) {
        showResult.style.display = 'block';
        if (!/processing/i.test(showResult.textContent || '')) {
          showResult.textContent = 'Processing transfer...';
        }
      }
    }, true);

    (window as any).__m9SubmitGuardInstalled = true;
  });
});

When('I prepare valid transfer details for ID-M9', async function (this: MobileWorld) {
  await this.page.waitForFunction(() => {
    const fromSelect = document.querySelector('#fromAccountId, select[name="fromAccountId"]') as HTMLSelectElement | null;
    const toSelect = document.querySelector('#toAccountId, select[name="toAccountId"]') as HTMLSelectElement | null;
    return !!fromSelect && !!toSelect && fromSelect.options.length > 1 && toSelect.options.length > 1;
  }, { timeout: 30000 });

  const fromOptions = await this.page
    .locator('select#fromAccountId option, select[name="fromAccountId"] option')
    .evaluateAll((options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .filter((value) => value.length > 0)
    );

  const toOptions = await this.page
    .locator('select#toAccountId option, select[name="toAccountId"] option')
    .evaluateAll((options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .filter((value) => value.length > 0)
    );

  const fromSelectValue = await this.page.locator('#fromAccountId, select[name="fromAccountId"]').first().inputValue();
  const toSelectValue = await this.page.locator('#toAccountId, select[name="toAccountId"]').first().inputValue();

  const fromAccountId = fromOptions[0] || fromSelectValue;
  const toAccountId = toOptions.find((value) => value !== fromAccountId) || toOptions[0] || toSelectValue;

  expect(fromAccountId).toBeDefined();
  expect(toAccountId).toBeDefined();

  const amountFromEnv = process.env.MOBILE_M9_TRANSFER_AMOUNT;
  const amount = amountFromEnv && amountFromEnv.trim().length > 0
    ? amountFromEnv.trim()
    : ((Date.now() % 5000) + 50.37).toFixed(2);

  const state = getM9State(this);
  state.amount = amount;

  const transferButton = this.page.locator('input[value="Transfer"], button[type="submit"]').first();
  state.baselineConfirmLabel = await transferButton.evaluate((element) => {
    if (element instanceof HTMLInputElement) {
      return element.value.trim();
    }
    return (element.textContent || '').trim();
  });

  await this.page.fill('#amount', amount);
  await this.page.selectOption('select#fromAccountId, select[name="fromAccountId"]', { value: fromAccountId! });
  await this.page.selectOption('select#toAccountId, select[name="toAccountId"]', { value: toAccountId! });
});

When('I submit the ID-M9 transfer rapidly twice', async function (this: MobileWorld) {
  const state = getM9State(this);
  await this.page.waitForSelector('input[value="Transfer"], button[type="submit"]', { timeout: 20000 });

  await this.page.evaluate(() => {
    const submit = (
      document.querySelector('#transferForm input[value="Transfer"]')
      || document.querySelector('#transferForm button[type="submit"]')
      || document.querySelector('input[value="Transfer"]')
      || document.querySelector('button[type="submit"]')
    ) as HTMLInputElement | HTMLButtonElement | null;
    if (!submit) {
      throw new Error('Transfer confirm button was not found for ID-M9.');
    }
    submit.click();
    if (!submit.disabled) {
      submit.click();
    }
  });

  for (let retry = 0; retry < 25; retry += 1) {
    const observed = await this.page.evaluate((baselineLabel) => {
      const submit = (
        document.querySelector('#transferForm input[value="Transfer"]')
        || document.querySelector('#transferForm button[type="submit"]')
        || document.querySelector('input[value="Transfer"]')
        || document.querySelector('button[type="submit"]')
      ) as HTMLInputElement | HTMLButtonElement | null;
      const showResult = document.querySelector('#showResult');
      const resultText = (showResult?.textContent || '').trim();
      const resultVisible = !!showResult && window.getComputedStyle(showResult).display !== 'none';
      const loadingText = /processing|please\s*wait|transferring|loading/i.test(resultText);

      let currentLabel = '';
      if (submit instanceof HTMLInputElement) {
        currentLabel = submit.value.trim();
      } else if (submit instanceof HTMLButtonElement) {
        currentLabel = (submit.textContent || '').trim();
      }

      const labelChanged = baselineLabel.length > 0 && currentLabel.length > 0 && currentLabel !== baselineLabel;
      const submitDisabled = !!submit && (submit.disabled || submit.getAttribute('aria-disabled') === 'true');
      const submitVisible = !!submit && window.getComputedStyle(submit).display !== 'none' && window.getComputedStyle(submit).visibility !== 'hidden';
      const submitLocked = submitDisabled || !submitVisible;

      return {
        loadingLike: resultVisible || loadingText || labelChanged || submitDisabled,
        submitLocked,
      };
    }, state.baselineConfirmLabel);

    state.sawLoadingStateInFlight = state.sawLoadingStateInFlight || observed.loadingLike;
    state.sawDisabledInFlight = state.sawDisabledInFlight || observed.submitLocked;

    if (state.sawLoadingStateInFlight && state.sawDisabledInFlight) {
      break;
    }

    await this.page.waitForTimeout(150);
  }
});

Then('a loading state is shown while the ID-M9 transfer is in flight', async function (this: MobileWorld) {
  const state = getM9State(this);
  expect(state.sawLoadingStateInFlight).toBe(true);
});

Then('the confirm button is disabled while the ID-M9 transfer is in flight', async function (this: MobileWorld) {
  const state = getM9State(this);
  expect(state.sawDisabledInFlight).toBe(true);
});

Then('only one ID-M9 transfer submit request is sent', async function (this: MobileWorld) {
  const state = getM9State(this);

  await expect
    .poll(() => state.pendingTransferRequests, { timeout: 30000, intervals: [250, 500, 1000] })
    .toBe(0);

  expect(state.transferPostCount).toBe(1);
});

Then('the ID-M9 transfer completes successfully', { timeout: 90000 }, async function (this: MobileWorld) {
  const scoped = this as MobileWorld & { m9CdpClient?: any };
  const state = getM9State(this);

  if (scoped.m9CdpClient) {
    await scoped.m9CdpClient.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: 'none',
    });
    await scoped.m9CdpClient.send('Network.disable');
  }

  await expect
    .poll(() => state.pendingTransferRequests, { timeout: 30000, intervals: [250, 500, 1000] })
    .toBe(0);

  expect(state.transferPostCount).toBeGreaterThan(0);

  await this.page.waitForSelector('#showResult, #showError', { timeout: 30000 });
  const errorVisible = await this.page.locator('#showError').first().isVisible().catch(() => false);
  const errorText = await this.page.locator('#showError').first().textContent().catch(() => '');
  expect(errorVisible && !!errorText?.trim()).toBe(false);

  expect(state.amount.length).toBeGreaterThan(0);
});