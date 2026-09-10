import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';

const dashboardHtml = `
  <main>
    <h1>Mobile Banking</h1>
    <button data-testid="github-authorize">Continue with GitHub</button>
    <p data-testid="login-error" hidden>GitHub authentication failed.</p>
  </main>`;

const githubHtml = `
  <main>
    <h1>GitHub authorization</h1>
    <button data-testid="oauth-allow">Authorize</button>
    <button data-testid="oauth-deny">Deny</button>
    <section data-testid="mfa-panel" hidden>
      <label for="mfa-code">Verification code</label>
      <input id="mfa-code" autocomplete="one-time-code" inputmode="numeric">
      <button data-testid="mfa-submit">Verify</button>
    </section>
  </main>`;

function oauthState(world: MobileWorld): { expectedCode: string } {
  const scoped = world as MobileWorld & { githubOAuthState?: { expectedCode: string } };
  if (!scoped.githubOAuthState) scoped.githubOAuthState = { expectedCode: '123456' };
  return scoped.githubOAuthState;
}

Given('I open the mobile GitHub OAuth mock', async function (this: MobileWorld) {
  await this.page.setContent(dashboardHtml);
  await this.page.getByTestId('github-authorize').click();
  await this.page.setContent(githubHtml);
});

When('I authorize the GitHub OAuth request', async function (this: MobileWorld) {
  await this.page.getByTestId('oauth-allow').click();
  await this.page.getByTestId('mfa-panel').evaluate((element) => {
    element.removeAttribute('hidden');
  });
});

When('I complete the GitHub MFA challenge with a valid code', async function (this: MobileWorld) {
  const state = oauthState(this);
  await this.page.locator('#mfa-code').fill(state.expectedCode);
  await this.page.getByTestId('mfa-submit').click();
  await this.page.setContent('<main><h1>Mobile Banking Dashboard</h1></main>');
});

When('I complete the GitHub MFA challenge with an invalid code', async function (this: MobileWorld) {
  await this.page.locator('#mfa-code').fill('000000');
  await this.page.getByTestId('mfa-submit').click();
  await this.page.setContent('<main><p data-testid="login-error">GitHub authentication failed.</p></main>');
});

When('I deny the GitHub OAuth request', async function (this: MobileWorld) {
  await this.page.getByTestId('oauth-deny').click();
  await this.page.setContent('<main><p data-testid="login-error">GitHub authentication failed.</p></main>');
});

Then('the mobile dashboard should be displayed', async function (this: MobileWorld) {
  await expect(this.page.getByRole('heading', { name: 'Mobile Banking Dashboard' })).toBeVisible();
});

Then('the mobile login error should be displayed', async function (this: MobileWorld) {
  await expect(this.page.getByTestId('login-error')).toBeVisible();
});

Given('the real GitHub OAuth environment is configured', async function () {
  for (const name of ['GITHUB_OAUTH_CLIENT_ID', 'GITHUB_OAUTH_REDIRECT_URI', 'GITHUB_OAUTH_CLIENT_SECRET', 'GITHUB_TEST_TOTP_SECRET']) {
    if (!process.env[name]) throw new Error(`${name} must be configured for @real-oauth`);
  }
});

When('I open the real mobile GitHub OAuth authorization URL', async function (this: MobileWorld) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI!,
    scope: 'read:user user:email',
    state: 'mobile-test-state',
  });
  await this.page.goto(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

When('I complete the real GitHub MFA challenge with the configured TOTP', async function () {
  throw new Error(
    'Real GitHub MFA requires an approved test-account login flow and TOTP secret integration. ' +
    'Do not automate GitHub credentials in this step until the OAuth callback service is configured.',
  );
});
