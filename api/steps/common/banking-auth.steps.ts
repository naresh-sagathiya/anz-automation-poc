import { Given } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

Given(
  "I am authenticated as {string}",
  async function (this: CustomWorld, username: string) {
    const response = await this.authService.login(username, "Password123!");
    expect(response.status()).toBe(200);
    this.responseBody = await response.json();
    this.accessToken = this.responseBody.accessToken;
    this.customerId = (this.responseBody as any).user.customerId;
  },
);
