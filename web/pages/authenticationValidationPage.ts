/** Page object for validating authentication, protected-page navigation, and session expiry. */
import { BrowserContext, Cookie, Page, expect } from '@playwright/test';

export class AuthenticationValidationPage {
  readonly page: Page;
  readonly dashboardUrl: string = 'https://github.com/dashboard';
  readonly settingsUrl: string = 'https://github.com/settings/profile';
  readonly loginUrl: string = 'https://github.com/login';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a protected GitHub page (dashboard or settings)
   */
  async navigateToProtectedPage(): Promise<void> {
    // Try to navigate to settings which is a protected page
    await this.page.goto(this.settingsUrl);
    // If redirected to login, it means session is not active
    if (this.page.url().includes('/login')) {
      console.log('Page redirected to login - session not active');
    }
  }

  /**
   * Navigate to dashboard
   */
  async navigateToDashboard(): Promise<void> {
    await this.page.goto(this.dashboardUrl);
  }

  /**
   * Navigate to settings
   */
  async navigateToSettings(): Promise<void> {
    await this.page.goto(this.settingsUrl);
  }

  /**
   * Clear session storage
   */
  async clearSessionStorage(): Promise<void> {
    await this.page.evaluate(() => {
      sessionStorage.clear();
    });
  }

  /**
   * Clear local storage
   */
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Clear all cookies
   */
  async clearCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }

  /**
   * Get all cookies
   */
  async getCookies(): Promise<Cookie[]> {
    return await this.page.context().cookies();
  }

  /**
   * Get storage state
   */
  async getStorageState(): Promise<Awaited<ReturnType<BrowserContext['storageState']>>> {
    return await this.page.context().storageState();
  }

  /**
   * Clear all storage (cookies, localStorage, sessionStorage)
   */
  async clearAllStorage(): Promise<void> {
    await this.clearCookies();
    await this.clearLocalStorage();
    await this.clearSessionStorage();
  }

  /**
   * Check if user is authenticated by verifying cookies and storage
   */
  async isAuthenticated(): Promise<boolean> {
    const cookies = await this.getCookies();
    const hasAuthCookie = cookies.some(c => 
      c.name.toLowerCase().includes('auth') || 
      c.name.toLowerCase().includes('sid') || 
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('logged_in')
    );
    return hasAuthCookie && cookies.length > 0;
  }

  /**
   * Check if currently on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/login');
  }

  /**
   * Check if currently on authenticated page
   */
  async isOnAuthenticatedPage(): Promise<boolean> {
    const url = this.page.url();
    return !url.includes('/login') && url.includes('github.com');
  }

  /**
   * Wait for redirect to login page
   */
  async waitForLoginPageRedirect(timeout: number = 10000): Promise<void> {
    await this.page.waitForURL(/.*\/login.*/, { timeout });
  }

  /**
   * Get authentication-related cookies
   */
  async getAuthenticationCookies(): Promise<Cookie[]> {
    const cookies = await this.getCookies();
    return cookies.filter(c => 
      c.name.toLowerCase().includes('auth') || 
      c.name.toLowerCase().includes('sid') || 
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('logged_in')
    );
  }

  /**
   * Simulate session timeout by clearing all auth data
   */
  async simulateSessionTimeout(): Promise<void> {
    // Clear all cookies
    await this.clearCookies();
    // Clear storage
    await this.clearAllStorage();
    // Reload page to apply changes
    await this.page.reload();
  }

  /**
   * Get the current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Navigate back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Navigate forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    try {
      const loginField = this.page.locator('#login_field');
      const passwordField = this.page.locator('#password');
      return await loginField.isVisible() && await passwordField.isVisible();
    } catch (e) {
      return false;
    }
  }

  /**
   * Verify storage state is cleared
   */
  async verifyStorageStateCleared(): Promise<boolean> {
    const storageState = await this.getStorageState();
    const cookies = storageState.cookies || [];
    
    const localStorageSize = await this.page.evaluate(() => {
      return localStorage.length;
    });

    const sessionStorageSize = await this.page.evaluate(() => {
      return sessionStorage.length;
    });

    return cookies.length === 0 && localStorageSize === 0 && sessionStorageSize === 0;
  }
}
