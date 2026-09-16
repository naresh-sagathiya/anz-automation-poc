import { Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { statementSchema } from "../../models/payment.model";
import { CustomWorld } from "../../support/world";
import { parseSchema } from "../../support/schema";

When(
  "I request the statement for the selected account",
  async function (this: CustomWorld) {
    if (!this.selectedAccount) {
      const accounts = await this.accountService.getAccounts(
        this.customerId,
        this.accessToken,
      );
      this.selectedAccount = (await accounts.json())[0];
    }
    this.response = await this.statementService.get(
      this.accessToken,
      this.selectedAccount.accountId,
    );
    expect(this.response.status()).toBe(200);
    this.statementBody = parseSchema(
      statementSchema,
      await this.response.json(),
      "statement",
    );
  },
);

Then("the statement has a valid schema", function (this: CustomWorld) {
  expect(statementSchema.safeParse(this.statementBody).success).toBeTruthy();
});

Then(
  "the statement transactions reconcile with the closing balance",
  function (this: CustomWorld) {
    const movement = this.statementBody.transactions.reduce(
      (total: number, transaction: { type: string; amount: number }) =>
        total + (transaction.type === "CREDIT" ? transaction.amount : -transaction.amount),
      0,
    );
    expect(this.statementBody.openingBalance + movement).toBe(
      this.statementBody.closingBalance,
    );
  },
);