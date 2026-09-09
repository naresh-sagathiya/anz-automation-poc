import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

Given(
  "I authenticate with a configured API user",
  async function (this: CustomWorld) {
    const username = process.env.API_USERNAME || "alice";
    const password = process.env.API_PASSWORD || "Password123!";

    this.response = await this.authService.login(username, password);
    expect(this.response.status()).toBe(200);

    this.responseBody = await this.response.json();
    this.accessToken = this.responseBody.accessToken;
    this.refreshToken = this.responseBody.refreshToken;
  },
);

When("I refresh the access token and reuse it", async function (this: CustomWorld) {
  this.response = await this.authService.refreshToken(this.refreshToken);
  const body = await this.response.json();

  if (this.response.status() === 200) {
    this.newAccessToken = body.accessToken;
    this.refreshToken = body.refreshToken;
    this.responseBody = body;
  }
});

Then("the refreshed token is valid for subsequent calls", async function (this: CustomWorld) {
  expect(this.newAccessToken).toBeDefined();
  this.response = await this.authService.getCustomer(this.customerId || "CUST-001", this.newAccessToken);
  expect(this.response.status()).toBe(200);
});
