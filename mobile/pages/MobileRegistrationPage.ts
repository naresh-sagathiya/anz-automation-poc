import { expect, Page } from '@playwright/test';

export interface MobileRegistrationData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  usernamePrefix: string;
  password: string;
  confirmPassword: string;
}

export class MobileRegistrationPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Register' }).click();
    await expect(this.page).toHaveURL(/register\.htm/);
  }

  async register(data: MobileRegistrationData): Promise<void> {
    await this.page.locator('input[name="customer.firstName"]').fill(data.firstName);
    await this.page.locator('input[name="customer.lastName"]').fill(data.lastName);
    await this.page.locator('input[name="customer.address.street"]').fill(data.address);
    await this.page.locator('input[name="customer.address.city"]').fill(data.city);
    await this.page.locator('input[name="customer.address.state"]').fill(data.state);
    await this.page.locator('input[name="customer.address.zipCode"]').fill(data.zipCode);
    await this.page.locator('input[name="customer.phoneNumber"]').fill(data.phone);
    await this.page.locator('input[name="customer.ssn"]').fill(data.ssn);
    await this.page.locator('input[name="customer.username"]').fill(`${data.usernamePrefix}${Date.now()}`);
    await this.page.locator('input[name="customer.password"]').fill(data.password);
    await this.page.locator('input[name="repeatedPassword"]').fill(data.confirmPassword);
    await this.page.locator('input[value="Register"]').click();
  }

  async verifyRegistrationSuccess(): Promise<void> {
    await expect(this.page.locator('h1.title')).toContainText('Welcome', { timeout: 20000 });
  }

  async verifyFieldsAreVisibleWithoutClipping(): Promise<void> {
    const fields = this.page.locator('input');
    const count = await fields.count();
    for (let index = 0; index < count; index += 1) {
      const field = fields.nth(index);
      if (await field.isVisible()) {
        const box = await field.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          const viewport = this.page.viewportSize();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport?.width ?? 0);
        }
      }
    }
  }
}