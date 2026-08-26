import { Given, When, Then } from "@cucumber/cucumber";

import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

/**
 * Refresh access token
 */
When("I refresh the access token", async function (this: CustomWorld) {
  this.response = await this.authService.refreshToken(this.refreshToken);

  const body = await this.response.json();

  if (this.response.status() === 200) {
    this.newAccessToken = body.accessToken;

    this.refreshToken = body.refreshToken;
  } else {
    this.errorBody = body;
  }
});

/**
 * Verify new access token
 */
Then("a new access token should be returned", function (this: CustomWorld) {
  expect(this.newAccessToken).toBeDefined();

  expect(this.newAccessToken).not.toBe("");

  expect(this.newAccessToken).not.toBe(this.accessToken);
});

/**
 * Access protected API using newly refreshed token
 */
When(
  "I access customer {string} using the new access token",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.requestContext.get(`/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${this.newAccessToken}`,
      },
    });

    if (this.response.status() !== 200) {
      this.errorBody = await this.response.json();
    }
  },
);

/**
 * Revoke current access token
 */
When("I revoke the access token", async function (this: CustomWorld) {
  this.response = await this.authService.revokeToken(
    this.accessToken,
    this.accessToken,
  );

  const body = await this.response.json();

  if (this.response.status() !== 200) {
    this.errorBody = body;
  }
});

/**
 * Access protected API with revoked token
 */
When(
  "I access customer {string} using the revoked access token",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.requestContext.get(`/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    this.errorBody = await this.response.json();
  },
);
