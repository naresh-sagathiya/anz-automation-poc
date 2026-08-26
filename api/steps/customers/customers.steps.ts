import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";
import CustomerApi from "../../services/CustomerService";

Given("the Customer API is available", async function (this: CustomWorld) {
  this.customerApi = new CustomerApi(this.request);
});

When(
  "I request customer details for customer ID {int}",
  async function (this: CustomWorld, customerId: number) {
    this.response = await this.customerApi.getCustomer(customerId);
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
    const body = await this.response.json();

    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("firstName");
    expect(body).toHaveProperty("lastName");
    expect(body).toHaveProperty("address");
  },
);
