import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MobileWorld } from '../support/world';
import { MobilePaymentRotationPage, PaymentDraft } from '../pages/MobilePaymentRotationPage';

type RotationState = {
  draft?: PaymentDraft;
};

function getRotationState(world: MobileWorld): RotationState {
  const scoped = world as MobileWorld & { rotationState?: RotationState };
  if (!scoped.rotationState) {
    scoped.rotationState = {};
  }
  return scoped.rotationState;
}

Given('I open the mobile bill pay form for rotation testing', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  await pageModel.openBillPayPage();
});

When('I create a mobile payment draft', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  const state = getRotationState(this);

  const fromAccountOptions = await this.page.locator('select[name="fromAccountId"] option').evaluateAll((options) =>
    options.map((option) => option.value).filter((value) => value.length > 0)
  );
  const fromAccountId = fromAccountOptions[0] || await this.page.locator('select[name="fromAccountId"]').inputValue();
  const draft: PaymentDraft = {
    payeeName: 'Landscape Demo Payee',
    street: '100 Demo Street',
    city: 'Sydney',
    state: 'NSW',
    zipCode: '2000',
    phoneNumber: '0400000000',
    accountNumber: '987654',
    verifyAccount: '987654',
    amount: '45.00',
    fromAccountId,
  };

  await pageModel.fillDraft(draft);
  state.draft = draft;
});

When('I rotate the payment form to landscape', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  await pageModel.rotateToLandscape();
});

When('I rotate the payment form back to portrait', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  await pageModel.rotateToPortrait();
});

Then('the mobile payment draft is preserved in landscape', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  const state = getRotationState(this);
  expect(state.draft).toBeDefined();
  await pageModel.expectDraftPreserved(state.draft!);
});

Then('the payment layout stays stable in landscape', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  await pageModel.expectLayoutStable();
});

Then('the mobile payment draft is preserved in portrait', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  const state = getRotationState(this);
  expect(state.draft).toBeDefined();
  await pageModel.expectDraftPreserved(state.draft!);
});

Then('the payment layout stays stable in portrait', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  await pageModel.expectLayoutStable();
});

When('I submit the rotated mobile payment draft', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  await pageModel.submitPayment();
});

Then('the mobile payment is completed successfully', async function (this: MobileWorld) {
  const pageModel = new MobilePaymentRotationPage(this.page);
  await pageModel.expectPaymentComplete();
});