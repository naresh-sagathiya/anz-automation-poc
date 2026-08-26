import { Before, After, Given, When, Then } from "@cucumber/cucumber";

import { expect } from "@playwright/test";

import { CustomWorld } from "../../support/world";

Before(async function (this: CustomWorld) {
  await this.initialize();
});

After(async function (this: CustomWorld) {
  await this.dispose();
});

Given("the banking API is available", async function (this: CustomWorld) {
  const response = await this.requestContext.get("/health");

  expect(response.status()).toBe(200);
});

Then(
  "the login response status should be {int}",
  async function (this: CustomWorld, expectedStatus: number) {
    expect(this.response.status()).toBe(expectedStatus);
  },
);

Then(
  "the login response should contain an access token",
  async function (this: CustomWorld) {
    expect(this.responseBody.accessToken).toBeDefined();

    expect(this.responseBody.accessToken).not.toBe("");
  },
);

Then(
  "the login response should contain a refresh token",
  async function (this: CustomWorld) {
    expect(this.responseBody.refreshToken).toBeDefined();

    expect(this.responseBody.refreshToken).not.toBe("");
  },
);

Then(
  "the token type should be {string}",
  async function (this: CustomWorld, expectedTokenType: string) {
    expect(this.responseBody.tokenType).toBe(expectedTokenType);
  },
);

Then(
  "the access token expiry should be greater than zero",
  async function (this: CustomWorld) {
    expect(this.responseBody.expiresIn).toBeGreaterThan(0);
  },
);

Then(
  "the access token should contain an expiry claim",
  async function (this: CustomWorld) {
    const token = this.responseBody.accessToken;

    const parts = token.split(".");

    expect(parts.length).toBe(3);

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    expect(payload.exp).toBeDefined();

    expect(typeof payload.exp).toBe("number");

    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  },
);

Then(
  "the login response should contain a valid expiry date",
  async function (this: CustomWorld) {
    const expiresAt = this.responseBody.expiresAt;

    expect(expiresAt).toBeDefined();

    const expiryTime = Date.parse(expiresAt);

    expect(Number.isNaN(expiryTime)).toBe(false);

    expect(expiryTime).toBeGreaterThan(Date.now());
  },
);

Then(
  "the login response should not contain the password",
  async function (this: CustomWorld) {
    const bodyText = JSON.stringify(this.responseBody).toLowerCase();

    expect(bodyText).not.toContain("password");

    expect(bodyText).not.toContain("password123");
  },
);

Then(
  "the login response should not contain sensitive personal information",
  async function (this: CustomWorld) {
    const body = this.responseBody as any;

    expect(body).not.toHaveProperty("ssn");

    expect(body).not.toHaveProperty("socialSecurityNumber");

    expect(body).not.toHaveProperty("dateOfBirth");

    expect(body).not.toHaveProperty("phoneNumber");

    expect(body).not.toHaveProperty("address");
  },
);
