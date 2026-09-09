import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';

type TrafficSafetyState = {
  requestUrls: string[];
  responseUrls: string[];
  insecureUrls: string[];
  sensitiveQueryUrls: string[];
  thirdPartyUrls: string[];
};

const sensitivePatterns = [
  'username',
  'password',
  'customer',
  'customerid',
  'account',
  'accountid',
  'ssn',
  'token',
  'session',
  'auth',
  'amount',
  'pin',
  'routing',
  'card',
  'cvv',
  'transaction',
  'payment',
  'loan',
];

const analyticsPatterns = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'segment.io',
  'mixpanel.com',
  'facebook.net',
  'facebook.com',
  'hotjar.com',
  'fullstory.com',
  'amplitude.com',
  'intercom.io',
  'newrelic.com',
  'appmetrica.com',
  'datadoghq.com',
  'sentry.io',
  'analytics',
  'pixel',
  'gtm',
];

function getTrafficSafetyState(world: MobileWorld): TrafficSafetyState {
  const scoped = world as MobileWorld & { trafficSafetyState?: TrafficSafetyState };

  if (!scoped.trafficSafetyState) {
    scoped.trafficSafetyState = {
      requestUrls: [],
      responseUrls: [],
      insecureUrls: [],
      sensitiveQueryUrls: [],
      thirdPartyUrls: [],
    };
  }

  return scoped.trafficSafetyState;
}

function isSensitiveQueryString(url: string): boolean {
  try {
    const parsed = new URL(url);
    const lowerKeys = Array.from(parsed.searchParams.keys()).map((key) => key.toLowerCase());
    return lowerKeys.some((key) => sensitivePatterns.some((pattern) => key.includes(pattern)));
  } catch {
    return false;
  }
}

function isThirdPartyAnalyticsRequest(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const combined = `${host} ${path}`;

    if (host.includes('parabank') || host.includes('parasoft') || host.includes('localhost')) {
      return false;
    }

    return analyticsPatterns.some((pattern) => combined.includes(pattern));
  } catch {
    return false;
  }
}

function recordTransmittedUrl(url: string, state: TrafficSafetyState): void {
  if (!url || !url.startsWith('http')) {
    return;
  }

  state.requestUrls.push(url);

  if (!url.startsWith('https://')) {
    state.insecureUrls.push(url);
  }

  if (isSensitiveQueryString(url)) {
    state.sensitiveQueryUrls.push(url);
  }

  if (isThirdPartyAnalyticsRequest(url)) {
    state.thirdPartyUrls.push(url);
  }
}

When('I monitor mobile network traffic for sensitive data exposure', async function (this: MobileWorld) {
  const state = getTrafficSafetyState(this);
  state.requestUrls = [];
  state.responseUrls = [];
  state.insecureUrls = [];
  state.sensitiveQueryUrls = [];
  state.thirdPartyUrls = [];

  this.page.on('request', (request) => {
    recordTransmittedUrl(request.url(), state);
  });

  this.page.on('response', (response) => {
    recordTransmittedUrl(response.url(), state);
    state.responseUrls.push(response.url());
  });
});

When('I navigate to account overview and transfer pages', async function (this: MobileWorld) {
  await this.page.click('text=Accounts Overview');
  await this.page.waitForURL(/overview\.htm/, { timeout: 20000 });
  await this.page.click('text=Transfer Funds');
  await this.page.waitForURL(/transfer\.htm/, { timeout: 20000 });
});

Then('all mobile network requests use HTTPS', async function (this: MobileWorld) {
  const state = getTrafficSafetyState(this);
  expect(state.insecureUrls, `Insecure request URLs observed: ${state.insecureUrls.join(', ')}`).toEqual([]);
});

Then('no sensitive account data appears in URL query strings', async function (this: MobileWorld) {
  const state = getTrafficSafetyState(this);
  expect(state.sensitiveQueryUrls, `Sensitive query-string URLs observed: ${state.sensitiveQueryUrls.join(', ')}`).toEqual([]);
});

Then('no third-party analytics domains are contacted', async function (this: MobileWorld) {
  const state = getTrafficSafetyState(this);
  expect(state.thirdPartyUrls, `Third-party analytics URLs observed: ${state.thirdPartyUrls.join(', ')}`).toEqual([]);
});
