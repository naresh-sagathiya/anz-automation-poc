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

  registeredCredentials?: {
    username: string;
    password: string;
  };
  openedAccountId?: string;
  initialBalance?: number;
  paymentRequestCount?: number;


  constructor(options: IWorldOptions) {

    super(options);

  }

}


setWorldConstructor(CustomWorld);