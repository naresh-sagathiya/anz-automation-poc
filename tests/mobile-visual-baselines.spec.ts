import { expect, Page, test, TestInfo } from '@playwright/test';
import { MobileLoginPage } from '../mobile/pages/MobileLoginPage';

const mobileProjects = new Set([
  'iPad',
  'iPhone 12',
  'iPhone 12 Pro Max',
  'Pixel 5',
  'Galaxy S9+',
  'iPad Mini',
]);

function dynamicContent(page: Page) {
  return [
    page.locator('#accountTable, #transactionTable'),
    page.locator('#accountTable td:nth-child(2), #accountTable td:nth-child(3)'),
    page.locator('#accountTable tfoot td'),
    page.locator('#transactionTable td:first-child'),
  ];
}

async function login(page: Page, testInfo: TestInfo): Promise<void> {
  testInfo.setTimeout(60000);
  const loginPage = new MobileLoginPage(page);
  await loginPage.open();
  const username = process.env.PARABANK_USER || 'john';
  const password = process.env.PARABANK_PASS || 'demo';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.locator('input[name="username"]').fill(username, { timeout: 10000 });
    await page.locator('input[name="password"]').fill(password, { timeout: 10000 });
    await page.locator('input[value="Log In"]').click({ timeout: 10000 });

    const redirected = await page
      .waitForURL(/overview\.htm/, { timeout: 10000 })
      .then(() => true, () => false);
    if (redirected) return;
  }

  if (await page.getByText('An internal error has occurred and has been logged.').isVisible().catch(() => false)) {
    testInfo.skip(true, 'ParaBank returned its known upstream internal-error page during login');
  }

  throw new Error(`Mobile login did not reach the dashboard: ${page.url()}`);
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(!mobileProjects.has(testInfo.project.name), 'M15 runs only for mobile device projects');
});

test('M15 dashboard visual baseline', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    mask: dynamicContent(page),
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03,
    timeout: 10000,
  });
});

test('M15 transfer visual baseline', async ({ page }, testInfo) => {
  await login(page, testInfo);
  await page.getByRole('link', { name: 'Transfer Funds' }).click();
  await expect(page).toHaveURL(/transfer\.htm/);
  await expect(page).toHaveScreenshot('transfer.png', {
    fullPage: true,
    mask: dynamicContent(page),
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03,
    timeout: 10000,
  });
});
