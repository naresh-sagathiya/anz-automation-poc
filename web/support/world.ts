/** Custom Cucumber world that stores browser, page, and scenario state for web tests. */
import {
  IWorldOptions,
  World,
  setWorldConstructor
} from '@cucumber/cucumber';
 
import {
  Browser,
  BrowserContext,
  Page
} from '@playwright/test';
 
 
export class CustomWorld extends World {
 
  browser!: Browser;
 
  context!: BrowserContext;
 
  page!: Page;
  secondaryContext?: BrowserContext;
  secondaryPage?: Page;
  secondaryPageData?: string;

 
  registeredCredentials?: {
    username: string;
    password: string;
  };
  openedAccountId?: string;
  initialBalance?: number;
  paymentRequestCount?: number;
  personDetails?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  currentTransactions?: any[];
  lastExportedFile?: string;
 
 
  constructor(options: IWorldOptions) {
 
    super(options);
 
  }
 
}
 
 
setWorldConstructor(CustomWorld);
 