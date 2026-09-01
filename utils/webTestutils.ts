import { Page } from "@playwright/test";

export class TestUtils {
  static async logout(page: Page): Promise<void> {
    const logoutLink = page.getByRole("link", { name: /log out/i });
    if (await logoutLink.isVisible().catch(() => false)) {
      await logoutLink.click();
    }
  }
}
