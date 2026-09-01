import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { payeeSchema } from "../../models/payment.model";
import { CustomWorld } from "../../support/world";
import { parseSchema } from "../../../utils/schema";

When("I create a valid payee", async function (this: CustomWorld) {
  this.payeePayload = {
    name: `Utilities-${Date.now()}`,
    bsb: "123456",
    accountNumber: `${Date.now()}`.slice(-8),
  };
  this.response = await this.payeeService.create(
    this.accessToken,
    this.payeePayload,
  );
  this.payeeBody = parseSchema(
    payeeSchema,
    await this.response.json(),
    "payee",
  );
});
When("I create the same payee again", async function (this: CustomWorld) {
  this.response = await this.payeeService.create(
    this.accessToken,
    this.payeePayload,
  );
});
When(
  "I create a payee with an invalid BSB",
  async function (this: CustomWorld) {
    this.response = await this.payeeService.create(this.accessToken, {
      name: "Bad",
      bsb: "123",
      accountNumber: "12345678",
    });
  },
);
When(
  "I update the payee name to {string}",
  async function (this: CustomWorld, name: string) {
    this.response = await this.payeeService.update(
      this.accessToken,
      this.payeeBody.payeeId,
      {
        name,
        bsb: this.payeePayload.bsb,
        accountNumber: this.payeePayload.accountNumber,
      },
    );
  },
);
When("I delete the payee", async function (this: CustomWorld) {
  this.response = await this.payeeService.delete(
    this.accessToken,
    this.payeeBody.payeeId,
  );
});
Then("the payee is no longer found", async function (this: CustomWorld) {
  const response = await this.payeeService.get(
    this.accessToken,
    this.payeeBody.payeeId,
  );
  expect(response.status()).toBe(404);
});
