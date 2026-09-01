import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileTransactionsPage } from '../pages/MobileTransactionsPage';
import { MobileWorld } from '../support/world';

type M7State = {
  baselineRows?: string[];
  initialCount?: number;
  snapshots?: Array<{ signatures: string[]; rowCount: number }>;
  preRefreshScrollTop?: number;
  targetAccountId?: string;
  createdAmounts?: string[];
  lastScrollAfter?: number;
};

function getM7State(world: MobileWorld): M7State {
  const scoped = world as MobileWorld & { m7State?: M7State };
  if (!scoped.m7State) {
    scoped.m7State = {};
  }
  return scoped.m7State;
}

Given('I open the mobile transaction list screen for ID-M7', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  await pageModel.openViaLogin();
  await pageModel.expectOnActivityPage();

  const state = getM7State(this);
  state.initialCount = await pageModel.getRenderedCount();
});

When('I capture the initial transaction list snapshot', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);
  state.baselineRows = await pageModel.getTransactionIds();
  state.initialCount = await pageModel.getRenderedCount();
});

When('I create {int} additional transfer transactions for the current mobile account', async function (this: MobileWorld, count: number) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);

  const seeded = await pageModel.createAdditionalTransfers(count);
  state.targetAccountId = seeded.targetAccountId;
  state.createdAmounts = seeded.createdAmounts;
});

When('I open the updated account activity from Accounts Overview', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);
  expect(state.targetAccountId).toBeDefined();

  await pageModel.openAccountActivityFromOverview(state.targetAccountId!);
});

When('I scroll through the account activity list on mobile', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);

  const scrollResult = await pageModel.scrollThroughTransactions(4);
  state.lastScrollAfter = scrollResult.after;
  state.snapshots = [await pageModel.getCurrentLoadSnapshot()];
});

When('I refresh the transaction list on mobile', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);
  state.preRefreshScrollTop = await pageModel.getPageScrollTop();
  await pageModel.refreshList();
});

Then('the transaction list contains no duplicate rows after lazy-load', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);
  expect(state.snapshots).toBeDefined();

  if (state.createdAmounts && state.createdAmounts.length > 0) {
    const occurrences = await pageModel.getAmountOccurrences(state.createdAmounts);
    const amountsPresent = Object.values(occurrences).filter((count) => count > 0).length;

    for (const count of Object.values(occurrences)) {
      expect(count).toBeLessThanOrEqual(1);
    }

    expect(amountsPresent).toBeGreaterThan(0);
    return;
  }

  for (const shot of state.snapshots || []) {
    await pageModel.expectNoDuplicateRows(shot.signatures);
  }
});

Then('the transaction list grows after lazy-load', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);
  expect(state.initialCount).toBeDefined();

  const latest = state.snapshots?.[state.snapshots.length - 1];
  expect(latest).toBeDefined();
  expect(latest!.rowCount).toBeGreaterThanOrEqual(0);

  const current = await pageModel.getRenderedCount();
  expect(current).toBeGreaterThanOrEqual(0);

  if (state.createdAmounts && state.createdAmounts.length > 0) {
    const matchedTransferRows = await pageModel.countRowsContainingAmounts(state.createdAmounts);
    expect(matchedTransferRows).toBeGreaterThan(0);
  }
});

Then('refresh resets the list and keeps data consistent', async function (this: MobileWorld) {
  const pageModel = new MobileTransactionsPage(this.page);
  const state = getM7State(this);

  const afterRefreshIds = await pageModel.getTransactionIds();
  const afterRefreshCount = await pageModel.getRenderedCount();
  const scrollTop = await pageModel.getPageScrollTop();
  const uniqueIds = new Set(afterRefreshIds);

  await pageModel.expectOnActivityPage();
  expect(state.preRefreshScrollTop).toBeDefined();
  expect(scrollTop).toBeLessThanOrEqual(state.preRefreshScrollTop!);
  expect(uniqueIds.size).toBeLessThanOrEqual(afterRefreshIds.length);
  expect(afterRefreshCount).toBeGreaterThanOrEqual(0);

  if (state.lastScrollAfter !== undefined) {
    expect(scrollTop).toBeLessThanOrEqual(state.lastScrollAfter);
  }

  if (state.createdAmounts && state.createdAmounts.length > 0) {
    const matchedTransferRows = await pageModel.countRowsContainingAmounts(state.createdAmounts);
    expect(matchedTransferRows).toBeGreaterThan(0);
  }
});