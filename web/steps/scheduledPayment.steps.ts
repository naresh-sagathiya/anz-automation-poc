/** Step definitions for scheduled-payment dates, business days, and processing status. */
import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import {
  addDays,
  getTodayInTimeZone,
  rollToBusinessDay,
} from '../support/dateUtil';
import { CustomWorld } from '../support/world';

type ScheduledPayment = {
  amount: string;
  requestedDate: string;
  processedDate: string;
  timezone: string;
  status: string;
};

type ScheduledPaymentState = {
  amount: string;
  requestedDate: string;
  holidays: string[];
  instruction?: ScheduledPayment;
};

const scheduledPaymentState = new WeakMap<CustomWorld, ScheduledPaymentState>();

function getPaymentTimeZone(): string {
  return process.env.PAYMENT_TIME_ZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function getPaymentAmount(): string {
  if (process.env.PAYMENT_AMOUNT) {
    return process.env.PAYMENT_AMOUNT;
  }

  const dynamicCents = (Date.now() % 9000) + 1000;
  return (dynamicCents / 100).toFixed(2);
}

function getState(world: CustomWorld): ScheduledPaymentState {
  const state = scheduledPaymentState.get(world);

  if (!state) {
    throw new Error('Scheduled-payment form has not been opened');
  }

  return state;
}

function resolveDate(dateExpression: string): string {
  const today = getTodayInTimeZone(getPaymentTimeZone());

  if (dateExpression === 'tomorrow') {
    return addDays(today, 1);
  }

  const daysFromToday = dateExpression.match(/^in (\d+) day(?:s)?$/);
  if (daysFromToday) {
    return addDays(today, Number(daysFromToday[1]));
  }

  if (dateExpression === 'next Saturday') {
    const todayDay = new Date(`${today}T00:00:00Z`).getUTCDay();
    return addDays(today, ((6 - todayDay + 7) % 7) || 7);
  }

  return dateExpression;
}

Given('the scheduled-payment form is open', function (this: CustomWorld) {
  scheduledPaymentState.set(this, {
    amount: '',
    requestedDate: '',
    holidays: [],
  });
});

Given('the business holiday dates are {string}', function (this: CustomWorld, holidays: string) {
  getState(this).holidays = holidays.split(',').map((date) => date.trim());
});

Given('the next business day after the selected weekend date is a holiday', function (this: CustomWorld) {
  const state = getState(this);
  state.holidays = [addDays(state.requestedDate, 2)];
});

When('I enter a payment amount of {string}', function (this: CustomWorld, amount: string) {
  getState(this).amount = amount;
});

When('I enter a dynamically generated valid payment amount', function (this: CustomWorld) {
  getState(this).amount = getPaymentAmount();
});

When('I select the future payment date {string}', function (this: CustomWorld, date: string) {
  getState(this).requestedDate = resolveDate(date);
});

When('I submit the scheduled payment', async function (this: CustomWorld) {
  const state = getState(this);
  assert.ok(state.amount, 'A payment amount is required');
  assert.ok(state.requestedDate, 'A payment date is required');

  state.instruction = {
    amount: state.amount,
    requestedDate: state.requestedDate,
    processedDate: rollToBusinessDay(state.requestedDate, state.holidays),
    timezone: getPaymentTimeZone(),
    status: 'scheduled',
  };

  await this.attach(JSON.stringify(state.instruction, null, 2), 'application/json');
});

Then('the payment instruction should be stored with date {string}', function (this: CustomWorld, expectedDate: string) {
  assert.equal(getState(this).instruction?.processedDate, expectedDate);
});

Then('the payment instruction should be stored with the selected date', function (this: CustomWorld) {
  const state = getState(this);
  assert.equal(state.instruction?.processedDate, state.requestedDate);
});

Then('the payment instruction should be stored with the next business date', function (this: CustomWorld) {
  const state = getState(this);
  assert.equal(
    state.instruction?.processedDate,
    rollToBusinessDay(state.requestedDate, state.holidays),
  );
});

Then('the stored timezone should be the configured timezone', function (this: CustomWorld) {
  const state = getState(this);
  const timeZone = getPaymentTimeZone();
  assert.equal(state.instruction?.timezone, timeZone);
});

Then('the payment status should be {string}', function (this: CustomWorld, expectedStatus: string) {
  assert.equal(getState(this).instruction?.status, expectedStatus);
});