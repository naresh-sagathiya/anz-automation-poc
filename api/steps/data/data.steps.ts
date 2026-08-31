import { After, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../../support/world";

After(async function (this: CustomWorld) {
  if (this.seedBody?.customerId && !this.seedCleanupComplete) {
    await this.dataFactoryService.cleanup(
      this.accessToken,
      this.seedBody.customerId,
    );
  }
});

When(
  "I seed a customer through the data factory",
  async function (this: CustomWorld) {
    this.response = await this.dataFactoryService.seed(this.accessToken);
    this.seedBody = await this.response.json();
    this.seedCleanupComplete = false;
  },
);
Then(
  "the seeded customer has an account and transaction history",
  async function (this: CustomWorld) {
    const accountResponse = await this.accountService.getAccounts(
      this.seedBody.customerId,
      this.accessToken,
    );
    expect(accountResponse.status()).toBe(200);
    const accounts = await accountResponse.json();
    expect(accounts[0].accountId).toBe(this.seedBody.accountId);
    const transactions = await (
      await this.accountService.getTransactions(
        this.seedBody.accountId,
        this.accessToken,
      )
    ).json();
    expect(transactions.items.length).toBeGreaterThan(0);
  },
);
Then("the seeded customer has a payee", async function (this: CustomWorld) {
  const response = await this.payeeService.listForCustomer(
    this.accessToken,
    this.seedBody.customerId,
  );
  expect(response.status()).toBe(200);
  expect((await response.json()).length).toBeGreaterThan(0);
});
When("I clean up the seeded customer", async function (this: CustomWorld) {
  this.response = await this.dataFactoryService.cleanup(
    this.accessToken,
    this.seedBody.customerId,
  );
  this.seedCleanupComplete = true;
});
Then(
  "the seeded customer is no longer available",
  async function (this: CustomWorld) {
    const response = await this.authService.getCustomer(
      this.seedBody.customerId,
      this.accessToken,
    );
    expect(response.status()).toBe(404);
  },
);
