import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { z } from "zod";
import { AccountService } from "../services/AccountService";
import { CustomWorld } from "../support/world";

const accountSchema = z.object({ id: z.number().int(), customerId: z.number().int(), type: z.enum(["CHECKING", "SAVINGS", "LOAN"]), balance: z.number() });
const transactionSchema = z.object({ id: z.number().int(), accountId: z.number().int(), type: z.enum(["Credit", "Debit"]), date: z.number().int(), amount: z.number(), description: z.string() });
const customerSchema = z.object({ id: z.number().int() }).passthrough();
type Account = z.infer<typeof accountSchema>;
type Transaction = z.infer<typeof transactionSchema>;

function credentials() { return { username: process.env.PARABANK_USERNAME ?? process.env.PARABANK_USER ?? "john", password: process.env.PARABANK_PASSWORD ?? process.env.PARABANK_PASS ?? "demo" }; }
async function loadAccounts(world: CustomWorld): Promise<Account[]> {
  const { username, password } = credentials(); const login = await world.accountService.login(username, password);
  expect(login.status(), "ParaBank login should succeed").toBe(200); world.customerId = customerSchema.parse(await login.json()).id;
  const response = await world.accountService.getAccounts(world.customerId); expect(response.status(), "accounts lookup should succeed").toBe(200);
  world.accounts = z.array(accountSchema).parse(await response.json()); expect(world.accounts.length).toBeGreaterThan(0); return world.accounts;
}

async function selectAccountWithTransactions(world: CustomWorld): Promise<Transaction[]> {
  const accounts = world.accounts.length ? world.accounts : await loadAccounts(world);
  for (const account of accounts) { const response = await world.accountService.getTransactions(account.id); expect(response.status()).toBe(200); const transactions = z.array(transactionSchema).parse(await response.json()); if (transactions.length) { world.selectedAccount = account; world.transactions = transactions; return transactions; } }
  throw new Error("No runtime customer account has transactions.");
}

Given("the ParaBank Account API is available", async function (this: CustomWorld) { this.accountService = new AccountService(this.requestContext); });
When("I request the accounts for the configured customer", async function (this: CustomWorld) { await loadAccounts(this); });
When("I request one account by ID from the accounts list", async function (this: CustomWorld) { const account = (this.accounts.length ? this.accounts : await loadAccounts(this))[0]; const response = await this.accountService.getAccount(account.id); expect(response.status()).toBe(200); this.selectedAccount = accountSchema.parse(await response.json()); });
Then("the accounts list response matches the account list schema", function (this: CustomWorld) { expect(z.array(accountSchema).safeParse(this.accounts).success).toBeTruthy(); });
Then("the account detail response matches the account schema", function (this: CustomWorld) { expect(accountSchema.safeParse(this.selectedAccount).success).toBeTruthy(); });
Then("every returned account is consistent with the logged-in customer", function (this: CustomWorld) { for (const account of this.accounts) { expect(account.customerId).toBe(this.customerId); expect(Number.isFinite(account.balance)).toBeTruthy(); } });
When("I request an account with transaction history", async function (this: CustomWorld) { await selectAccountWithTransactions(this); });
When("I request the transaction history for that account", async function (this: CustomWorld) { if (!this.selectedAccount) await selectAccountWithTransactions(this); const response = await this.accountService.getTransactions(this.selectedAccount.id); expect(response.status()).toBe(200); this.transactions = z.array(transactionSchema).parse(await response.json()); });
Then("the transaction history response matches the transaction list schema", function (this: CustomWorld) { expect(z.array(transactionSchema).safeParse(this.transactions).success).toBeTruthy(); expect(this.transactions.length).toBeGreaterThan(0); });
Then("the transaction ledger is independently compared with the current balance", function (this: CustomWorld) { const ledgerTotal = this.transactions.reduce((total, item) => total + (item.type === "Credit" ? item.amount : -item.amount), 0); /* No opening balance or complete-history guarantee exists. Do not derive one from current balance. */ expect(ledgerTotal, "ParaBank ledger/current-balance mismatch detected; full reconciliation cannot be confirmed").toBe(this.selectedAccount.balance); });
When("I request transactions using supported ParaBank filters", async function (this: CustomWorld) { const transactions = this.transactions.length ? this.transactions : await selectAccountWithTransactions(this); const amount = transactions.find((item) => item.amount > 0)?.amount; if (amount === undefined) throw new Error("No positive transaction amount for amount filter."); this.filteredAmount = amount; const response = await this.accountService.getTransactionsByAmount(this.selectedAccount.id, amount); expect(response.status()).toBe(200); this.filteredTransactions = z.array(transactionSchema).parse(await response.json()); this.pages = [transactions.slice(0, 2), transactions.slice(2, 4), transactions.slice(4)]; });
Then("every filtered transaction satisfies the requested filter", function (this: CustomWorld) { expect(this.filteredTransactions.length).toBeGreaterThan(0); for (const item of this.filteredTransactions) expect(item.amount).toBe(this.filteredAmount); });
Then("client-side transaction pages have no duplicates", function (this: CustomWorld) { const ids = this.pages.flat().map((item) => item.id); expect(new Set(ids).size).toBe(ids.length); });
Then("the total transaction count remains consistent across client-side pages", function (this: CustomWorld) { expect(this.pages.reduce((count, page) => count + page.length, 0)).toBe(this.transactions.length); });
