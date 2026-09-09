import fs from 'node:fs';
import path from 'node:path';
import { BrowserContext } from 'playwright';

export const offlineMobileUrl = 'https://parabank.parasoft.com/parabank/';

const offlinePage = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>ParaBank | Offline Mobile</title></head>
  <body>
    <main id="mobile-offline-fixture">
      <h1>ParaBank</h1>
      <p data-testid="offline-status">Offline mobile fixture</p>
      <form id="loginPanel">
        <label>Username <input name="username"></label>
        <label>Password <input name="password" type="password"></label>
        <button type="submit">Log In</button>
      </form>
    </main>
  </body>
</html>`;

export async function installOfflineMobileMocks(context: BrowserContext): Promise<void> {
  const harPath = path.resolve(__dirname, 'parabank-mobile.har');

  // The fallback is deliberately local so an unexpected request cannot reach a live backend.
  await context.route('**/*', async (route) => {
    const request = route.request();
    if (request.resourceType() === 'document') {
      await route.fulfill({ status: 200, contentType: 'text/html', body: offlinePage });
      return;
    }

    if (request.url().includes('/services/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', source: 'route-mock' }),
      });
      return;
    }

    await route.fulfill({ status: 200, body: '' });
  });

  await context.routeFromHAR(harPath, { notFound: 'fallback' });
}

export function offlineHarPath(): string {
  return path.resolve(__dirname, 'parabank-mobile.har');
}
