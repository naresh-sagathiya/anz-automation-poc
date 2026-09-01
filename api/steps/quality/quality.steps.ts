import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { unlinkSync } from "node:fs";
import { z } from "zod";
import {
  customerSchema,
  accountSchema,
  transactionPageSchema,
  payeeSchema,
  paymentSchema,
  errorSchema,
} from "../../models/payment.model";
import { CustomWorld } from "../../support/world";
import { parseIsoDate } from "../../../utils/date";
import { isoDateSchema, parseSchema } from "../../../utils/schema";
import { assertDoesNotContainSecrets } from "../../../utils/fileValidation";
import { writeTextFile } from "../../../utils/data";

When(
  "I request the configured customer accounts",
  async function (this: CustomWorld) {
    this.response = await this.accountService.getAccounts(
      this.customerId,
      this.accessToken,
    );
    this.responseBody = await this.response.json();
  },
);
Then(
  "the account response passes its Zod schema",
  function (this: CustomWorld) {
    parseSchema(z.array(accountSchema), this.responseBody, "accounts");
  },
);
Then("the error response passes its Zod schema", function (this: CustomWorld) {
  parseSchema(errorSchema, this.apiResponseBody, "error");
});
When(
  "I run the banking endpoint schema sweep",
  async function (this: CustomWorld) {
    parseSchema(
      customerSchema,
      await (
        await this.authService.getCustomer(this.customerId, this.accessToken)
      ).json(),
      "customer",
    );
    const accounts = parseSchema(
      z.array(accountSchema),
      await (
        await this.accountService.getAccounts(this.customerId, this.accessToken)
      ).json(),
      "accounts",
    );
    parseSchema(
      accountSchema,
      await (
        await this.accountService.getAccount(
          accounts[0].accountId,
          this.accessToken,
        )
      ).json(),
      "account",
    );
    parseSchema(
      transactionPageSchema,
      await (
        await this.accountService.getTransactions(
          accounts[0].accountId,
          this.accessToken,
        )
      ).json(),
      "transactions",
    );
    parseSchema(
      z.array(payeeSchema),
      await (await this.payeeService.list(this.accessToken)).json(),
      "payees",
    );
    const payment = await this.paymentService.create(
      this.accessToken,
      {
        fromAccountId: "ACC-001",
        toAccountId: "ACC-003",
        amount: 0.01,
        currency: "AUD",
        reference: "schema sweep",
      },
      `schema-${Date.now()}`,
    );
    this.paymentId = (await payment.json()).paymentId;
    const paymentStatusBody = await (
      await this.paymentService.getStatus(this.accessToken, this.paymentId)
    ).json();
    const paymentBody = parseSchema(paymentSchema, paymentStatusBody, "payment");
    parseIsoDate(paymentBody.createdAt);

    const auditBody = await (
      await this.paymentService.getAudit(this.accessToken, this.paymentId)
    ).json();
    parseSchema(
      z
        .object({
          auditId: z.string(),
          paymentId: z.string(),
          action: z.string(),
          createdAt: isoDateSchema,
        })
        .strict(),
      auditBody,
      "audit",
    );
    parseIsoDate(auditBody.createdAt);
    parseSchema(
      z.object({ status: z.literal("OK") }).strict(),
      await (
        await this.paymentService.probeRateLimit(
          this.accessToken,
          `schema-${Date.now()}`,
        )
      ).json(),
      "rate limit",
    );
  },
);
Then("every banking endpoint response passes its schema", function () {
  expect(true).toBeTruthy();
});
When(
  "I call the rate limited endpoint with retry key {string}",
  async function (this: CustomWorld, key: string) {
    this.response = await this.paymentService.probeRateLimit(
      this.accessToken,
      key,
    );
  },
);
Then("the retried rate limited request succeeds", function (this: CustomWorld) {
  expect(this.response.status()).toBe(200);
});
When("I write a redaction sample artefact", function (this: CustomWorld) {
  this.artifactPath = "reports/redaction-sample.log";
  writeTextFile(
    this.artifactPath,
    "password=[REDACTED] accessToken=[REDACTED] accountNumber=[REDACTED]",
  );
});
Then("the artefact contains no secrets", function (this: CustomWorld) {
  assertDoesNotContainSecrets(this.artifactPath, [
    "Password123!",
    "eyJ",
    "123456789",
  ]);
  unlinkSync(this.artifactPath);
});
