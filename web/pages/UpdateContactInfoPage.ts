/** Page object for updating a customer's contact information. */
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';


export class UpdateContactInfoPage
  extends BasePage {
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zipCode: Locator;
  readonly phone: Locator;
  readonly updateProfileButton: Locator;
  readonly updateContactInfoLink: Locator;


  
  constructor(page: Page) {
    super(page);
    this.address = page.locator('input[name="customer.address.street"]');
    this.city = page.locator('input[name="customer.address.city"]');
    this.state = page.locator('input[name="customer.address.state"]');
    this.zipCode = page.locator('input[name="customer.address.zipCode"]');
    this.phone = page.locator('input[name="customer.phoneNumber"]');
    this.updateProfileButton = page.locator('input[value="Update Profile"]');
    this.updateContactInfoLink = page.getByRole('link', { name: 'Update Contact Info' });
  }

 async updateContactInfo(data: any): Promise<void> {
    await this.updateContactInfoLink.click();
    await this.address.fill(data.address);
    await this.city.fill(data.city);
    await this.state.fill(data.state);
    await this.zipCode.fill(data.zipCode);
    await this.phone.fill(data.phone);
    await this.updateProfileButton.click();
    expect (await this.page.locator('#updateProfileResult').textContent()).toContain('Your updated address and phone number have been added to the system. ');
    console.log(await this.page.locator('#updateProfileResult').textContent()); 
 }

}