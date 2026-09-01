import { Given } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

Given(
  "I am authenticated as {string}",
  async function (this: CustomWorld, username: string) {
    const password =
      username === "bob"
        ? process.env.API_PASSWORD_BOB || "Password123!"
        : process.env.API_PASSWORD_ALICE || "Password123!";

    const response = await this.authService.login(username, password);
    expect(response.status()).toBe(200);
    this.responseBody = await response.json();
    this.accessToken = this.responseBody.accessToken;
    this.customerId = (this.responseBody as any).user.customerId;
  },
);
