import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";
import { isFutureDate, parseIsoDate } from "../../../utils/date";

When("I request an MFA challenge", async function (this: CustomWorld) {
  this.response = await this.authService.createMfaChallenge(this.accessToken);

  const body = await this.response.json();

  if (this.response.status() === 201) {
    this.mfaBody = body;
    this.challengeId = body.challengeId;
    this.challengeToken = body.challengeToken;
  } else {
    this.errorBody = body;
  }
});

Then(
  "the MFA response status should be {int}",
  function (this: CustomWorld, expectedStatus: number) {
    expect(this.response.status()).toBe(expectedStatus);
  },
);

Then(
  "the MFA response should contain a challenge id",
  function (this: CustomWorld) {
    expect(this.mfaBody.challengeId).toBeDefined();

    expect(this.mfaBody.challengeId).not.toBe("");
  },
);

Then(
  "the MFA response should contain a challenge token",
  function (this: CustomWorld) {
    expect(this.mfaBody.challengeToken).toBeDefined();

    expect(this.mfaBody.challengeToken).not.toBe("");
  },
);

Then(
  "the MFA challenge token should be returned",
  function (this: CustomWorld) {
    expect(this.mfaBody).toBeDefined();

    expect(this.mfaBody.challengeToken).toBeDefined();

    expect(this.mfaBody.challengeToken).not.toBe("");
  },
);

Then("the MFA challenge id should be returned", function (this: CustomWorld) {
  expect(this.mfaBody).toBeDefined();

  expect(this.mfaBody.challengeId).toBeDefined();

  expect(this.mfaBody.challengeId).not.toBe("");
});

Then("the MFA challenge should have an expiry", function (this: CustomWorld) {
  expect(this.mfaBody.expiresIn).toBeGreaterThan(0);

  const parsedDate = parseIsoDate(this.mfaBody.expiresAt);

  expect(parsedDate.getTime()).toBeGreaterThan(Date.now());
  expect(isFutureDate(this.mfaBody.expiresAt)).toBeTruthy();
});

Then(
  "the MFA challenge should have 3 attempts remaining",
  function (this: CustomWorld) {
    expect(this.mfaBody.attemptsRemaining).toBe(3);
  },
);

When(
  "I verify the MFA challenge with code {string}",
  async function (this: CustomWorld, code: string) {
    this.response = await this.authService.verifyMfa(
      this.accessToken,
      this.challengeId,
      this.challengeToken,
      code,
    );

    const body = await this.response.json();

    if (this.response.status() === 200) {
      this.mfaBody = body;
    } else {
      this.errorBody = body;
    }
  },
);

When(
  "I verify the same MFA challenge again with code {string}",
  async function (this: CustomWorld, code: string) {
    this.response = await this.authService.verifyMfa(
      this.accessToken,
      this.challengeId,
      this.challengeToken,
      code,
    );

    const body = await this.response.json();
    if (this.response.status() === 200) {
      this.mfaBody = body;
    } else {
      this.errorBody = body;
    }
  },
);

Then(
  "the MFA error code should be {string}",
  function (this: CustomWorld, expectedCode: string) {
    expect(this.errorBody.code).toBe(expectedCode);
  },
);

Then(
  "the MFA attempts remaining should be {int}",
  function (this: CustomWorld, expectedAttempts: number) {
    const body =
      this.response.status() >= 200 && this.response.status() < 300
        ? this.mfaBody
        : this.errorBody;

    expect(body).toBeDefined();

    expect(body.attemptsRemaining).toBe(expectedAttempts);
  },
);
