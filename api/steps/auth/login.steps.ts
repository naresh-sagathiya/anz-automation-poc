import { Before, After, Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";
import { assertNoSensitiveFields } from "../../../utils/schema";
import { isFutureDate, parseIsoDate } from "../../../utils/date";

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
  function (this: CustomWorld, expectedStatus: number) {
    expect(this.response.status()).toBe(expectedStatus);
  },
);

Then(
  "the login response should contain an access token",
  function (this: CustomWorld) {
    expect(this.responseBody.accessToken).toBeDefined();

    expect(this.responseBody.accessToken).not.toBe("");
  },
);

Then(
  "the login response should contain a refresh token",
  function (this: CustomWorld) {
    expect(this.responseBody.refreshToken).toBeDefined();

    expect(this.responseBody.refreshToken).not.toBe("");
  },
);

Then(
  "the token type should be {string}",
  function (this: CustomWorld, expectedTokenType: string) {
    expect(this.responseBody.tokenType).toBe(expectedTokenType);
  },
);

Then(
  "the access token expiry should be greater than zero",
  function (this: CustomWorld) {
    expect(this.responseBody.expiresIn).toBeGreaterThan(0);
  },
);

Then(
  "the access token should contain an expiry claim",
  function (this: CustomWorld) {
    const token = this.responseBody.accessToken;

    expect(token).toBeDefined();

    const parts = token.split(".");

    /**
     * JWT should have:
     *
     * header.payload.signature
     */
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
  function (this: CustomWorld) {
    const expiresAt = this.responseBody.expiresAt;

    expect(expiresAt).toBeDefined();

    const parsedDate = parseIsoDate(expiresAt);

    expect(parsedDate.getTime()).toBeGreaterThan(Date.now());
    expect(isFutureDate(expiresAt)).toBeTruthy();
  },
);

Then(
  "the login response should not contain the password",
  function (this: CustomWorld) {
    assertNoSensitiveFields(this.responseBody, [
      "password",
      "ssn",
      "socialSecurityNumber",
      "dateOfBirth",
      "cardNumber",
      "accountNumber",
    ]);
    const bodyText = JSON.stringify(this.responseBody).toLowerCase();

    expect(bodyText).not.toContain("password");

    expect(bodyText).not.toContain("password123");
  },
);

Then(
  "the login response should not contain sensitive personal information",
  function (this: CustomWorld) {
    const body = this.responseBody as any;

    expect(body).not.toHaveProperty("ssn");

    expect(body).not.toHaveProperty("socialSecurityNumber");

    expect(body).not.toHaveProperty("dateOfBirth");

    expect(body).not.toHaveProperty("phoneNumber");

    expect(body).not.toHaveProperty("address");
  },
);

Then(
  "the login error code should be {string}",
  function (this: CustomWorld, expectedCode: string) {
    expect(this.responseBody.code).toBe(expectedCode);
  },
);

Then(
  "the login error message should be {string}",
  function (this: CustomWorld, expectedMessage: string) {
    expect(this.responseBody.message).toBe(expectedMessage);
  },
);

Then(
  "the login response should not contain an access token",
  function (this: CustomWorld) {
    expect(this.responseBody.accessToken).toBeUndefined();
  },
);

Then(
  "the login response should not contain a refresh token",
  function (this: CustomWorld) {
    expect(this.responseBody.refreshToken).toBeUndefined();
  },
);
