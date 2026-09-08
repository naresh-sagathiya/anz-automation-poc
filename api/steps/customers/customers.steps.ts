import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";
import { customerSchema } from "../../models/payment.model";
import { parseSchema } from "../../../utils/schema";

When(
  "I request customer details for customer ID {string}",
  async function (this: CustomWorld, customerId: string) {
    this.response = await this.authService.getCustomer(customerId, this.accessToken);
  },
);

Then(
  "the response status should be {int}",
  async function (this: CustomWorld, expectedStatus: number) {
    expect(this.response.status()).toBe(expectedStatus);
  },
);

Then(
  "the customer response should contain customer details",
  async function (this: CustomWorld) {
    parseSchema(customerSchema, await this.response.json(), "customer");
  },
);
