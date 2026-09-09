import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

Given(
  "I login with username {string} and password {string}",
  async function (this: CustomWorld, username: string, password: string) {
    this.response = await this.authService.login(username, password);

    this.responseBody = await this.response.json();
    if (this.response.status() === 200) {
      this.accessToken = this.responseBody.accessToken;
      this.refreshToken = this.responseBody.refreshToken;
    }
  },
);

Then(
  "the API response status should be {int}",
  function (this: CustomWorld, expectedStatus: number) {
    expect(this.response.status()).toBe(expectedStatus);
  },
);

Then(
  "the API error code should be {string}",
  function (this: CustomWorld, expectedCode: string) {
    expect(this.errorBody.code).toBe(expectedCode);
  },
);

When(
  "I access customer {string}",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.authService.getCustomer(
      customerId,
      this.accessToken,
    );
    if (this.response.status() === 200) {
      this.responseBody = await this.response.json();
    } else {
      this.errorBody = await this.response.json();
    }
  },
);
