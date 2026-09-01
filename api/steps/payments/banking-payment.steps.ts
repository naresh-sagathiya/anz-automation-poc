import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { errorSchema, paymentSchema } from "../../models/payment.model";
import { CustomWorld } from "../../support/world";
import { parseIsoDate } from "../../../utils/date";
import { isoDateSchema, parseSchema } from "../../../utils/schema";

When(
  "I create a payment of {float} with idempotency key {string}",
  async function (this: CustomWorld, amount: number, key: string) {
    this.idempotencyKey = `${key}-${Date.now()}`;
    const source = await this.accountService.getAccount(
      "ACC-001",
      this.accessToken,
    );
    const destination = await this.accountService.getAccount(
      "ACC-003",
      this.accessToken,
    );
    this.sourceBalanceBefore = (await source.json()).balance;
    this.destinationBalanceBefore = (await destination.json()).balance;
    this.response = await this.paymentService.create(
      this.accessToken,
      {
        fromAccountId: "ACC-001",
        toAccountId: "ACC-003",
        amount,
        currency: "AUD",
        reference: "Test payment",
      },
      this.idempotencyKey,
    );
    this.apiResponseBody = await this.response.json();
    this.paymentId = this.apiResponseBody.paymentId;
    this.firstPaymentId = this.paymentId;
  },
);

When(
  "I repeat the payment with idempotency key {string}",
  async function (this: CustomWorld, _key: string) {
    this.response = await this.paymentService.create(
      this.accessToken,
      {
        fromAccountId: "ACC-001",
        toAccountId: "ACC-003",
        amount: 10.25,
        currency: "AUD",
        reference: "Test payment",
      },
      this.idempotencyKey,
    );
    this.repeatedPayment = await this.response.json();
  },
);
Then(
  "the repeated payment has the original payment ID",
  function (this: CustomWorld) {
    expect(this.repeatedPayment.paymentId).toBe(this.paymentId);
  },
);
Then(
  "the source and destination balances moved exactly once by {float}",
  async function (this: CustomWorld, amount: number) {
    const source = await (
      await this.accountService.getAccount("ACC-001", this.accessToken)
    ).json();
    const destination = await (
      await this.accountService.getAccount("ACC-003", this.accessToken)
    ).json();
    expect(this.sourceBalanceBefore - source.balance).toBe(amount);
    expect(destination.balance - this.destinationBalanceBefore).toBe(amount);
  },
);
When(
  "I create another payment of {float} with idempotency key {string}",
  async function (this: CustomWorld, amount: number, key: string) {
    this.response = await this.paymentService.create(
      this.accessToken,
      {
        fromAccountId: "ACC-001",
        toAccountId: "ACC-003",
        amount,
        currency: "AUD",
      },
      `${key}-${Date.now()}`,
    );
    this.secondPaymentId = (await this.response.json()).paymentId;
  },
);
Then(
  "the second payment has a different payment ID",
  function (this: CustomWorld) {
    expect(this.secondPaymentId).not.toBe(this.firstPaymentId);
  },
);
Then(
  "the payment status is {string}",
  function (this: CustomWorld, status: string) {
    expect(
      parseSchema(paymentSchema, this.apiResponseBody, "payment").status,
    ).toBe(status);
  },
);
When(
  "I submit a payment with amount {float} and currency {string}",
  async function (this: CustomWorld, amount: number, currency: string) {
    this.response = await this.paymentService.create(this.accessToken, {
      fromAccountId: "ACC-001",
      toAccountId: "ACC-003",
      amount,
      currency,
    });
    this.apiResponseBody = await this.response.json();
  },
);
When(
  "I submit a payment with invalid field {string}",
  async function (this: CustomWorld, field: string) {
    const payload: any = {
      fromAccountId: "ACC-001",
      toAccountId: "ACC-003",
      amount: 1,
      currency: "AUD",
    };
    if (field === "bsb") payload.bsb = "123";
    if (field === "payee") payload.payeeId = "PAYEE-UNKNOWN";
    if (field === "missing") delete payload.fromAccountId;
    this.response = await this.paymentService.create(this.accessToken, payload);
    this.apiResponseBody = await this.response.json();
  },
);
Then(
  "the payment response status is {int}",
  function (this: CustomWorld, status: number) {
    expect(this.response.status()).toBe(status);
  },
);
Then(
  "the payment error has code {string}",
  function (this: CustomWorld, code: string) {
    expect(
      parseSchema(errorSchema, this.apiResponseBody, "payment error").code,
    ).toBe(code);
  },
);
When(
  "I request its status and audit record",
  async function (this: CustomWorld) {
    this.response = await this.paymentService.getStatus(
      this.accessToken,
      this.paymentId,
    );
    this.apiResponseBody = await this.response.json();
    this.auditBody = await (
      await this.paymentService.getAudit(this.accessToken, this.paymentId)
    ).json();
  },
);
When("I create a pending payment", async function (this: CustomWorld) {
  this.response = await this.paymentService.create(this.accessToken, {
    fromAccountId: "ACC-001",
    toAccountId: "ACC-003",
    amount: 1,
    currency: "AUD",
    initialStatus: "PENDING",
  });
  this.apiResponseBody = await this.response.json();
  this.paymentId = this.apiResponseBody.paymentId;
});
When(
  "I move the payment status to {string}",
  async function (
    this: CustomWorld,
    status: "PENDING" | "COMPLETED" | "FAILED",
  ) {
    this.response = await this.paymentService.updateStatus(
      this.accessToken,
      this.paymentId,
      status,
    );
    this.apiResponseBody = await this.response.json();
  },
);
When(
  "I try to move the payment status to {string}",
  async function (
    this: CustomWorld,
    status: "PENDING" | "COMPLETED" | "FAILED",
  ) {
    this.response = await this.paymentService.updateStatus(
      this.accessToken,
      this.paymentId,
      status,
    );
    this.apiResponseBody = await this.response.json();
  },
);
Then("the audit entry references the payment", function (this: CustomWorld) {
  expect(this.auditBody.paymentId).toBe(this.paymentId);
  expect(isoDateSchema.safeParse(this.auditBody.createdAt).success).toBeTruthy();
  expect(() => parseIsoDate(this.auditBody.createdAt)).not.toThrow();
});
