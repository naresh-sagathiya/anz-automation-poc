import { After, Before, Given, Then, When } from '@cucumber/cucumber';
import { MyBankingAndroidWorld } from '../support/world';

Before(async function (this: MyBankingAndroidWorld) {
  await this.initialize();
});

After(async function (this: MyBankingAndroidWorld) {
  await this.dispose();
});

Given('I launch My Banking App', async function (this: MyBankingAndroidWorld) {
  await this.driver.$('~Sign Up-screen').waitForDisplayed({ timeout: 30000 });
});

When('I open the registered device scan screen', async function (this: MyBankingAndroidWorld) {
  await this.driver.$('~Yes-button').click();
  await this.driver.$('~Scan a registered Device-screen').waitForDisplayed({ timeout: 30000 });
});

Then('the registered device scan screen should be displayed', async function (this: MyBankingAndroidWorld) {
  await this.driver.$('~Scan a registered Device-screen').waitForDisplayed({ timeout: 30000 });
});
