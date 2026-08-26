import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/registerPage';
import testData from '../test_data/paraBankData.json';

When('the customer registers a new user using registration test data', async function (this: CustomWorld) {
  console.log('Starting registration...');

  const loginPage = new LoginPage(this.page);
  await loginPage.openRegistration();

  const registerPage = new RegisterPage(this.page);
  this.registeredCredentials = await registerPage.register(testData.registration);

  console.log('Registration form submitted successfully');
});

Then('the customer registration should be successful', async function (this: CustomWorld) {
  await expect(this.page.locator('h1.title')).toContainText('Welcome');

  const credentials = this.registeredCredentials;
  if (!credentials) {
    throw new Error('Registered credentials were not captured');
  }

  const envPath = path.resolve(process.cwd(), '.env');
  const existingEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const envLines = existingEnv.split(/\r?\n/).filter((line, index, lines) => index < lines.length - 1 || line.length > 0);

  for (const [key, value] of Object.entries({
    LOGIN_USERNAME: credentials.username,
    LOGIN_PASSWORD: credentials.password
  })) {
    const lineIndex = envLines.findIndex(line => line.startsWith(`${key}=`));
    if (lineIndex >= 0) {
      envLines[lineIndex] = `${key}=${value}`;
    } else {
      envLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(envPath, `${envLines.join('\n')}\n`, 'utf8');
  process.env.LOGIN_USERNAME = credentials.username;
  process.env.LOGIN_PASSWORD = credentials.password;
  console.log(`Registration successful. Credentials saved to ${envPath}`);
});