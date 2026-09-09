/** Page object for creating a new ParaBank customer account. */
import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { TestUtils } from '../support/webTestutils';

export class RegisterPage extends BasePage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zipCode: Locator;
  readonly phone: Locator;
  readonly ssn: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    super(page);

    this.firstName = page.locator('input[name="customer.firstName"]');
    this.lastName = page.locator('input[name="customer.lastName"]');
    this.address = page.locator('input[name="customer.address.street"]');
    this.city = page.locator('input[name="customer.address.city"]');
    this.state = page.locator('input[name="customer.address.state"]');
    this.zipCode = page.locator('input[name="customer.address.zipCode"]');
    this.phone = page.locator('input[name="customer.phoneNumber"]');
    this.ssn = page.locator('input[name="customer.ssn"]');
    this.username = page.locator('input[name="customer.username"]');
    this.password = page.locator('input[name="customer.password"]');
    this.confirmPassword = page.locator('input[name="repeatedPassword"]');
    this.registerButton = page.locator('input[value="Register"]');
  }

  async register(data: any): Promise<{ username: string; password: string }> {
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.address.fill(data.address);
    await this.city.fill(data.city);
    await this.state.fill(data.state);
    await this.zipCode.fill(data.zipCode);
    await this.phone.fill(data.phone);
    await this.ssn.fill(data.ssn);

    const username = TestUtils.generateUniqueUsername(data.usernamePrefix);
    await this.username.fill(username);
    await this.password.fill(data.password);
    await this.confirmPassword.fill(data.confirmPassword);
    await this.registerButton.click();

    return { username, password: data.password };
  }
}