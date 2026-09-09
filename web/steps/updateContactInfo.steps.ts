/** Step definitions for updating and validating customer contact details. */
import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { UpdateContactInfoPage } from '../pages/UpdateContactInfoPage';
import { CustomWorld } from '../support/world';
import testData from '../testData/paraBankData.json';

When('the customer updates Contact details', async function (this: CustomWorld) {
    const updateContactInfoPage = new UpdateContactInfoPage(this.page);
    await updateContactInfoPage.updateContactInfo(testData.UpdateContactInfo);
})


