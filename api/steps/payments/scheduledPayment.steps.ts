import { Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { scheduledPaymentSchema } from "../../models/payment.model";
import { CustomWorld } from "../../support/world";
import { parseSchema } from "../../support/schema";

When("I create a scheduled payment for tomorrow", async function (this: CustomWorld) {
  this.response = await this.scheduledPaymentService.create(this.accessToken, {
    fromAccountId: "ACC-001",
    toAccountId: "ACC-003",
    amount: 25,
    currency: "AUD",
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reference: "Scheduled test payment",
  });
  this.scheduledPaymentBody = parseSchema(
    scheduledPaymentSchema,
    await this.response.json(),
    "scheduled payment",
  );
});

Then(
  "the scheduled payment is returned with status {string}",
  function (this: CustomWorld, status: string) {
    expect(this.scheduledPaymentBody.status).toBe(status);
  },
);

When("I cancel the scheduled payment", async function (this: CustomWorld) {
  this.response = await this.scheduledPaymentService.cancel(
    this.accessToken,
    this.scheduledPaymentBody.scheduledPaymentId,
  );
  this.scheduledPaymentBody = parseSchema(
    scheduledPaymentSchema,
    await this.response.json(),
    "cancelled scheduled payment",
  );
});

When(
  "I submit a scheduled payment above the payment limit",
  async function (this: CustomWorld) {
    this.response = await this.scheduledPaymentService.create(this.accessToken, {
      fromAccountId: "ACC-001",
      toAccountId: "ACC-003",
      amount: 10001,
      currency: "AUD",
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    this.apiResponseBody = await this.response.json();
  },
);

Then(
  "the scheduled payment response status is {int}",
  function (this: CustomWorld, status: number) {
    expect(this.response.status()).toBe(status);
  },
);

Then(
  "the scheduled payment error code is {string}",
  function (this: CustomWorld, code: string) {
    expect(this.apiResponseBody.code).toBe(code);
  },
);