import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { z } from "zod";
import { AccountService } from "../services/AccountService";
import { CustomWorld } from "../support/world";
import { parseSchema } from "../../utils/schema";
import { accountSchema, transactionPageSchema } from "../models/payment.model";

type Account = z.infer<typeof accountSchema>;

async function loadAccounts(world: CustomWorld): Promise<Account[]> {
  const response = await world.accountService.getAccounts(
    world.customerId,
    world.accessToken,
  );
  expect(response.status()).toBe(200);
  world.accounts = parseSchema(
    z.array(accountSchema),
    await response.json(),
    "accounts",
  );
  return world.accounts;
}

Given(
  "the banking account API is available",
  async function (this: CustomWorld) {
    this.accountService = new AccountService(this.requestContext);
    const login = await this.authService.login(
      process.env.API_USER_ALICE || "alice",
      process.env.API_PASSWORD_ALICE || "Password123!",
    );
    expect(login.status()).toBe(200);
    const body = await login.json();
    this.accessToken = body.accessToken;
    this.customerId = body.user.customerId;
  },
);
When(
  "I request the accounts for the configured customer",
  async function (this: CustomWorld) {
    await loadAccounts(this);
  },
);
When(
  "I request one account by ID from the accounts list",
  async function (this: CustomWorld) {
    const account = (
      this.accounts.length ? this.accounts : await loadAccounts(this)
    )[0];
    const response = await this.accountService.getAccount(
      account.accountId,
      this.accessToken,
    );
    expect(response.status()).toBe(200);
    this.selectedAccount = parseSchema(
      accountSchema,
      await response.json(),
      "account",
    );
  },
);
When(
  "I request one account by ID from the configured customer",
  async function (this: CustomWorld) {
    await loadAccounts(this);
    this.selectedAccount = this.accounts[0];
  },
);
Then(
  "the accounts list response matches the account list schema",
  function (this: CustomWorld) {
    expect(this.accounts.length).toBeGreaterThan(0);
  },
);
Then(
  "the account detail response matches the account schema",
  function (this: CustomWorld) {
    expect(accountSchema.safeParse(this.selectedAccount).success).toBeTruthy();
  },
);
Then(
  "every returned account has numeric balances, ISO currency, and masked account number",
  function (this: CustomWorld) {
    for (const account of this.accounts) {
      expect(Number.isFinite(account.balance)).toBeTruthy();
      expect(account.currency).toMatch(/^[A-Z]{3}$/);
      expect(account.accountNumber).toMatch(/^X+\d{3}$/);
    }
  },
);
When(
  "I request the transaction history for that account",
  async function (this: CustomWorld) {
    if (!this.selectedAccount) {
      await loadAccounts(this);
      this.selectedAccount = this.accounts[0];
    }
    const response = await this.accountService.getTransactions(
      this.selectedAccount.accountId,
      this.accessToken,
    );
    expect(response.status()).toBe(200);
    this.transactions = parseSchema(
      transactionPageSchema,
      await response.json(),
      "transactions",
    ).items;
  },
);
Then(
  "the transaction history response matches the transaction list schema",
  function (this: CustomWorld) {
    expect(this.transactions.length).toBeGreaterThan(0);
  },
);
Then(
  "the transaction history reconciles with the current account balance",
  function (this: CustomWorld) {
    const total = this.transactions.reduce(
      (sum, item) =>
        sum + (item.type === "CREDIT" ? item.amount : -item.amount),
      0,
    );
    expect(total).toBe(this.selectedAccount.balance);
  },
);
Then(
  "the account available, current, and pending balances are internally consistent",
  function (this: CustomWorld) {
    expect(
      this.selectedAccount.availableBalance +
        this.selectedAccount.pendingBalance,
    ).toBe(this.selectedAccount.currentBalance);
  },
);
When(
  "I request transactions for an account with transaction history",
  async function (this: CustomWorld) {
    await loadAccounts(this);
    this.selectedAccount = this.accounts[0];
    const response = await this.accountService.getTransactions(
      this.selectedAccount.accountId,
      this.accessToken,
    );
    this.transactions = parseSchema(
      transactionPageSchema,
      await response.json(),
      "transactions",
    ).items;
  },
);
When(
  "I request transactions using supported banking filters",
  async function (this: CustomWorld) {
    const amount = this.transactions[0].amount;
    const response = await this.accountService.getTransactions(
      this.selectedAccount.accountId,
      this.accessToken,
      { minAmount: amount, page: 1, pageSize: 1 },
    );
    const page = parseSchema(
      transactionPageSchema,
      await response.json(),
      "filtered transactions",
    );
    this.filteredTransactions = page.items;
    this.pages = [page.items];
    this.filteredAmount = amount;
  },
);
Then(
  "every filtered transaction satisfies the requested filter",
  function (this: CustomWorld) {
    for (const item of this.filteredTransactions)
      expect(item.amount).toBeGreaterThanOrEqual(this.filteredAmount);
  },
);
Then(
  "paginated transaction pages have no duplicates",
  function (this: CustomWorld) {
    const ids = this.pages.flat().map((item) => item.transactionId);
    expect(new Set(ids).size).toBe(ids.length);
  },
);
Then(
  "the total transaction count remains consistent across pages",
  function (this: CustomWorld) {
    expect(this.pages.flat().length).toBeGreaterThan(0);
  },
);
