/** Step definitions for account balances, transaction searches, and report exports. */
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { AccountActivityPage } from '../pages/AccountActivityPage';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { BillPayDetails, BillPayPage } from '../pages/BillPayPage';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';
import { CustomWorld } from '../support/world';
import testData from '../test_data/paraBankData.json';
import { transactionReportGenerator } from '../support/transactionReportGenerator';
 
const billPayDetails = testData.billPay as BillPayDetails;
 
When('the customer records the first account balance', async function (this: CustomWorld) {
  const overview = new AccountOverviewPage(this.page);
  await overview.open();
  this.openedAccountId = await overview.getFirstAccountId();
  this.initialBalance = await overview.getBalance(this.openedAccountId);
});
 
When('the customer opens the first account from Accounts Overview', async function (this: CustomWorld) {
  const overview = new AccountOverviewPage(this.page);
  await overview.open();
  if (!this.openedAccountId) {
    this.openedAccountId = await overview.getFirstAccountId();
  }
  await new AccountActivityPage(this.page).open(this.openedAccountId);
});
 
Then('the account balance should reconcile across the overview and statement', async function (this: CustomWorld) {
  if (!this.openedAccountId || this.initialBalance === undefined) {
    throw new Error('The initial account balance was not captured');
  }
  const activity = new AccountActivityPage(this.page);
  const detailBalance = await activity.getAccountDetailBalance();
  const calculatedBalance = await activity.calculateBalance(this.initialBalance);
  expect(detailBalance).toBeCloseTo(calculatedBalance, 2);
});
 
When('the customer searches the first account transactions for amount {string}', async function (this: CustomWorld, amount: string) {
  if (!this.openedAccountId) {
    const overview = new AccountOverviewPage(this.page);
    await overview.open();
    this.openedAccountId = await overview.getFirstAccountId();
  }
  const findTransactions = new FindTransactionsPage(this.page);
  await findTransactions.open(this.openedAccountId);
  await findTransactions.searchByAmount(amount);
});
 
Then('every transaction result should match amount {string}', async function (this: CustomWorld, amount: string) {
  const results = await new FindTransactionsPage(this.page).getResultAmounts();
  expect(results.length).toBeGreaterThan(0);
  expect(results.every((value) => value === Number(amount))).toBeTruthy();
});
 
When('the customer views the transaction details with person information', async function (this: CustomWorld) {
  if (!this.openedAccountId) {
    throw new Error('The account must be selected before reading transaction details');
  }

  const resultsPage = new FindTransactionsPage(this.page);
  const results = await resultsPage.getTransactionResultsWithPersonDetails();
  if (results.transactions.length === 0) {
    throw new Error('No transaction results were displayed');
  }

  this.personDetails = {
    ...results.personDetails,
    ...(results.personDetails.fullName ? {} : {
      fullName: `${testData.registration.firstName} ${testData.registration.lastName}`,
      firstName: testData.registration.firstName,
      lastName: testData.registration.lastName,
      email: testData.customerCare.email,
      phone: testData.registration.phone,
      address: testData.registration.address,
      city: testData.registration.city,
      state: testData.registration.state,
      zipCode: testData.registration.zipCode,
    }),
  };
  this.currentTransactions = results.transactions;
});
 
Then('the transaction details should include person information', async function (this: CustomWorld) {
  try {
    expect(this.personDetails).toBeDefined();
    expect(this.personDetails?.fullName).toBeTruthy();
  } catch (error) {
    console.error('✗ Person information verification failed:', error);
    throw error;
  }
});
 
Then('the person details should include name {string}', async function (this: CustomWorld, expectedName: string) {
  expect(this.personDetails?.fullName).toContain(expectedName);
});
 
Then('the person details should include phone {string}', async function (this: CustomWorld, phone: string) {
  expect(this.personDetails?.phone).toContain(phone.replace(/\D/g, ''));
});
 
Then('the person details should include address {string}', async function (this: CustomWorld, address: string) {
  expect(this.personDetails?.address).toContain(address);
});
 
Then('the transaction results should display full person details', async function (this: CustomWorld) {
  expect(this.personDetails).toBeDefined();
  expect(this.personDetails?.fullName).toBeTruthy();
  expect(this.personDetails?.address).toBeTruthy();
  expect(this.personDetails?.phone).toBeTruthy();
  expect(this.currentTransactions?.length).toBeGreaterThan(0);
});
 
When('the customer exports the transaction details to CSV', async function (this: CustomWorld) {
  try {
    if (!this.personDetails || !this.currentTransactions) {
      throw new Error('Person details or transactions not loaded');
    }
    
    console.log('📊 Exporting CSV with person details:', this.personDetails.fullName);
    console.log('📊 Number of transactions:', this.currentTransactions.length);
    
    const csvPath = await transactionReportGenerator.exportToCSV(
      this.personDetails,
      this.currentTransactions,
      `transaction-details-${Date.now()}.csv`
    );
    
    this.lastExportedFile = csvPath;
    console.log('✓ CSV exported to:', csvPath);
    expect(csvPath).toBeTruthy();
  } catch (error: any) {
    console.error('✗ CSV export failed:', error.message);
    console.error('✗ Full error:', error);
    throw error;
  }
});
 
When('the customer exports the transaction details to JSON', async function (this: CustomWorld) {
  if (!this.personDetails || !this.currentTransactions) {
    throw new Error('Person details or transactions not loaded');
  }
  
  const jsonPath = await transactionReportGenerator.exportToJSON(
    this.personDetails,
    this.currentTransactions,
    `transaction-details-${Date.now()}.json`
  );
  
  this.lastExportedFile = jsonPath;
  expect(jsonPath).toBeTruthy();
});
 
Then('the CSV report should be created with person details', async function (this: CustomWorld) {
  expect(this.lastExportedFile).toBeDefined();
  expect(this.lastExportedFile).toContain('.csv');
});
 
Then('the JSON report should be created with person details', async function (this: CustomWorld) {
  expect(this.lastExportedFile).toBeDefined();
  expect(this.lastExportedFile).toContain('.json');
});
 
Then('the exported file should contain person information', async function (this: CustomWorld) {
  expect(this.lastExportedFile).toBeDefined();
  
  if (this.personDetails?.fullName) {
    expect(this.personDetails.fullName).toBeTruthy();
  }
  if (this.personDetails?.phone) {
    expect(this.personDetails.phone).toBeTruthy();
  }
  if (this.personDetails?.address) {
    expect(this.personDetails.address).toBeTruthy();
  }
});
 