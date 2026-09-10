import { Then, When } from '@cucumber/cucumber';
import { expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { MobileWorld } from '../support/world';
import { MobileLoginPage } from '../pages/MobileLoginPage';

function dynamicContent(page: Page) {
  return [
    page.locator('#accountTable, #transactionTable'),
    page.locator('#accountTable td:nth-child(2), #accountTable td:nth-child(3)'),
    page.locator('#accountTable tfoot td'),
    page.locator('#transactionTable td:first-child'),
  ];
}

async function compareVisualBaseline(
  world: MobileWorld,
  name: 'dashboard' | 'transfer',
): Promise<void> {
  const screenshot = await world.page.screenshot({
    fullPage: true,
    mask: dynamicContent(world.page),
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
  const baselinePath = path.resolve(
    'tests',
    '__snapshots__',
    world.deviceName.replace(/[^a-zA-Z0-9-_]/g, '-'),
    'mobile-visual-baselines.spec.ts',
    `${name}.png`,
  );

  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Visual baseline not found for ${world.deviceName}: ${baselinePath}`);
  }

  const expected = PNG.sync.read(fs.readFileSync(baselinePath));
  const actual = PNG.sync.read(screenshot);
  if (expected.width !== actual.width || expected.height !== actual.height) {
    throw new Error(
      `Visual baseline dimensions differ for ${world.deviceName}: ` +
      `expected ${expected.width}x${expected.height}, received ${actual.width}x${actual.height}`,
    );
  }

  const diff = new PNG({ width: expected.width, height: expected.height });
  const differentPixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, {
    threshold: 0.1,
  });
  const differenceRatio = differentPixels / (expected.width * expected.height);
  if (differenceRatio > 0.03) {
    const diffPath = path.resolve(
      'test-results',
      `mobile-visual-baselines-${world.deviceName.replace(/[^a-zA-Z0-9-_]/g, '-')}-${name}-diff.png`,
    );
    fs.mkdirSync(path.dirname(diffPath), { recursive: true });
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    await world.attach(fs.readFileSync(diffPath), 'image/png');
    throw new Error(
      `Visual baseline mismatch for ${world.deviceName} (${(differenceRatio * 100).toFixed(2)}% different pixels). ` +
      `Diff: ${diffPath}`,
    );
  }
}

async function loginToDashboard(page: Page): Promise<void> {
  const loginPage = new MobileLoginPage(page);
  await loginPage.open();

  const username = process.env.PARABANK_USER || 'john';
  const password = process.env.PARABANK_PASS || 'demo';

  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[value="Log In"]').click();

  await page.waitForURL(/overview\.htm/, { timeout: 10000 });
}

When('I capture the mobile dashboard visual baseline', async function (this: MobileWorld) {
  try {
    await loginToDashboard(this.page);
    await compareVisualBaseline(this, 'dashboard');
  } catch (error) {
    this.visualBaselineFailures.push(`Dashboard: ${error instanceof Error ? error.message : String(error)}`);
  }
});

When('I capture the mobile transfer visual baseline', async function (this: MobileWorld) {
  try {
    await loginToDashboard(this.page);
    await this.page.getByRole('link', { name: 'Transfer Funds' }).click();
    await expect(this.page).toHaveURL(/transfer\.htm/);
    await compareVisualBaseline(this, 'transfer');
  } catch (error) {
    this.visualBaselineFailures.push(`Transfer: ${error instanceof Error ? error.message : String(error)}`);
  }
});

Then('the mobile visual baselines should match for the {string} device', async function (this: MobileWorld, profile: string) {
  expect(['android', 'ios']).toContain(profile);
  await expect(this.page.locator('body')).toBeVisible();
  if (this.visualBaselineFailures.length > 0) {
    throw new Error(this.visualBaselineFailures.join('\n'));
  }
});
