/** Step definitions for immediate fund-transfer setup, execution, and confirmation. */
import {
  Given,
  When,
  Then
} from '@cucumber/cucumber';

import {
  expect
} from '@playwright/test';

import {
  FundTransferPage
} from '../pages/immediateFundTransferPage';

import {
  CustomWorld
} from '../support/world';


type TransferState = {

  fromAccountId: string;

  toAccountId: string;

  sourceBalanceBefore?: number;

  destinationBalanceBefore?: number;

  sourceBalanceAfter?: number;

  destinationBalanceAfter?: number;

  transferAmount?: number;

  reference?: string;
};


const transferState =
  new WeakMap<
    object,
    TransferState
  >();


Given(
  'the customer navigates to Transfer Funds',

  async function (
    this: CustomWorld
  ) {

    const fundTransferPage =
      new FundTransferPage(
        this.page
      );

    await fundTransferPage.open();
  }
);


Given(
  'the customer has at least two accounts available for transfer',

  async function (
    this: CustomWorld
  ) {

    const fundTransferPage =
      new FundTransferPage(
        this.page
      );

    await fundTransferPage.open();

    const accounts =
      await fundTransferPage
        .getAvailableAccounts();

    expect(
      accounts.length
    ).toBeGreaterThanOrEqual(
      2
    );
  }
);


When(
  'the customer selects two different accounts for the transfer',

  async function (
    this: CustomWorld
  ) {

    const fundTransferPage =
      new FundTransferPage(
        this.page
      );

    const accounts =
      await fundTransferPage
        .selectTwoDifferentAccounts();

    transferState.set(
      this,
      {
        fromAccountId:
          accounts.fromAccountId,

        toAccountId:
          accounts.toAccountId
      }
    );
  }
);


Given(
  'the customer captures the source and destination account balances before transfer',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(
        this
      );

    if (!state) {

      throw new Error(
        'Transfer accounts have not been selected'
      );
    }

    const fundTransferPage =
      new FundTransferPage(
        this.page
      );

    state.sourceBalanceBefore =
      await fundTransferPage
        .getAccountBalance(
          state.fromAccountId
        );

    state.destinationBalanceBefore =
      await fundTransferPage
        .getAccountBalance(
          state.toAccountId
        );
  }
);

Given(
  'the customer captures the source account balance before transfer',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(this);

    if (!state) {
      throw new Error(
        'Transfer accounts have not been selected'
      );
    }

    const page =
      new FundTransferPage(
        this.page
      );

    state.sourceBalanceBefore =
      await page.getAccountBalance(
        state.fromAccountId
      );
  }
);

Given(
  'the customer captures the destination account balance before transfer',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(this);

    if (!state) {
      throw new Error(
        'Transfer accounts have not been selected'
      );
    }

    const page =
      new FundTransferPage(
        this.page
      );

    state.destinationBalanceBefore =
      await page.getAccountBalance(
        state.toAccountId
      );
  }
);


Then(
  'the customer captures the source account balance after transfer',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(this);

    if (!state) {
      throw new Error(
        'Transfer state was not initialized'
      );
    }

    const page =
      new FundTransferPage(
        this.page
      );

    state.sourceBalanceAfter =
      await page.getAccountBalance(
        state.fromAccountId
      );
  }
);


Then(
  'the customer captures the destination account balance after transfer',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(this);

    if (!state) {
      throw new Error(
        'Transfer state was not initialized'
      );
    }

    const page =
      new FundTransferPage(
        this.page
      );

    state.destinationBalanceAfter =
      await page.getAccountBalance(
        state.toAccountId
      );
  }
);


Given(
  'the customer captures the source and destination account balances',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(this);

    if (!state) {
      throw new Error(
        'Transfer accounts have not been selected'
      );
    }

    const page =
      new FundTransferPage(
        this.page
      );

    state.sourceBalanceBefore =
      await page.getAccountBalance(
        state.fromAccountId
      );

    await page.open();

    state.destinationBalanceBefore =
      await page.getAccountBalance(
        state.toAccountId
      );
  }
);


When(
  'the customer transfers amount {string}',

  async function (
    this: CustomWorld,
    amount: string
  ) {

    const state =
      transferState.get(
        this
      );

    if (!state) {

      throw new Error(
        'Transfer accounts have not been selected'
      );
    }

    const fundTransferPage =
      new FundTransferPage(
        this.page
      );

    await fundTransferPage.open();

    await fundTransferPage
      .transfer(
        state.fromAccountId,
        state.toAccountId,
        amount
      );

    state.transferAmount =
      Number(amount);
  }
);


Then(
  'the fund transfer should be completed successfully',

  async function (
    this: CustomWorld
  ) {

    await new FundTransferPage(
      this.page
    ).expectTransferComplete();
  }
);


Then(
  'the customer captures the source and destination account balances after transfer',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(this);

    if (!state) {
      throw new Error(
        'Transfer state was not initialized'
      );
    }

    const fundTransferPage =
      new FundTransferPage(
        this.page
      );

    state.sourceBalanceAfter =
      await fundTransferPage.getAccountBalance(
        state.fromAccountId
      );

    state.destinationBalanceAfter =
      await fundTransferPage.getAccountBalance(
        state.toAccountId
      );
  }
);


Then(
  'the debit and credit amounts should reconcile exactly',

  function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(
        this
      );

    if (
      !state ||
      state.sourceBalanceBefore === undefined ||
      state.sourceBalanceAfter === undefined ||
      state.destinationBalanceBefore === undefined ||
      state.destinationBalanceAfter === undefined
    ) {

      throw new Error(
        'Account balances are unavailable for reconciliation'
      );
    }

    const debit =
      Number(
        (
          state.sourceBalanceBefore -
          state.sourceBalanceAfter
        ).toFixed(2)
      );

    const credit =
      Number(
        (
          state.destinationBalanceAfter -
          state.destinationBalanceBefore
        ).toFixed(2)
      );

    expect(
      debit
    ).toBe(
      credit
    );
  }
);


Then(
  'a transfer reference should be produced',

  async function (
    this: CustomWorld
  ) {

    const state =
      transferState.get(
        this
      );

    if (!state) {

      throw new Error(
        'Transfer state was not initialized'
      );
    }

    const fundTransferPage =
      new FundTransferPage(
        this.page
      );

    state.reference =
      await fundTransferPage
        .getTransferReference();

    expect(
      state.reference
    ).toBeTruthy();
  }
);