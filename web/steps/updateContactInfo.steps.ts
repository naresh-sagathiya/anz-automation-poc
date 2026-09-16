/** Step definitions for updating and validating customer contact details. */
import { When } from '@cucumber/cucumber';
import { UpdateContactInfoPage } from '../pages/updateContactInfoPage';
import { CustomWorld } from '../support/world';
import testData from '../testData/paraBankData.json';

When('the customer updates Contact details', async function (this: CustomWorld) {
    const updateContactInfoPage = new UpdateContactInfoPage(this.page);
    await updateContactInfoPage.updateContactInfo(testData.UpdateContactInfo);
})


