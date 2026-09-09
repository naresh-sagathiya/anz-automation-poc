/** Step definitions for opening an additional account and verifying it appears. */
import { Then, When, setDefaultTimeout } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import {CustomWorld} from "../support/world";
import { OpenNewAccountPage } from "../pages/openNewAccountPage";

setDefaultTimeout(15000);

When("the customer creates a new additional account", async function (this: CustomWorld){
    const openNewAccountPage = new OpenNewAccountPage(this.page);
    // Store the generated ID so the next step can verify the overview post-condition.
    this.openedAccountId = await openNewAccountPage.openNewAccount('SAVINGS');
})

Then("the customer should see the new account in the Accounts Overview page", async function (this: CustomWorld){
    if (!this.openedAccountId) {
        throw new Error('The new account number was not captured');
    }

    // Verify the exact account created in this scenario, rather than a hardcoded ID.
    await expect(this.page.getByRole('heading', { name: 'Accounts Overview' })).toBeVisible();
    const accountPage = new OpenNewAccountPage(this.page);
    const openingBalance = await accountPage.getAccountBalance(this.openedAccountId);
    const expectedOpeningBalance = Number(process.env.OPENING_BALANCE || '100');
    expect(openingBalance).toBe(expectedOpeningBalance);
})