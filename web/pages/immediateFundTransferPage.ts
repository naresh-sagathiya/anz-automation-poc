/** Page object for selecting accounts and completing immediate fund transfers. */
import {
  Locator,
  Page,
  expect
} from '@playwright/test';

import {
  BasePage
} from './BasePage';


export class FundTransferPage
  extends BasePage {

  readonly transferLink: Locator;

  readonly fromAccount: Locator;

  readonly toAccount: Locator;

  readonly amount: Locator;

  readonly transferButton: Locator;

  readonly accountsOverviewLink: Locator;


  constructor(
    page: Page
  ) {

    super(page);

    this.transferLink =
      page.getByRole('link', {
        name: /Transfer Funds/i
      });

    this.fromAccount =
      page.locator('#fromAccountId');

    this.toAccount =
      page.locator('#toAccountId');

    this.amount =
      page.locator('#amount');

    this.transferButton =
      page.locator(
        'input[value="Transfer"]'
      );

    this.accountsOverviewLink =
      page.getByRole('link', {
        name: /Accounts Overview/i
      });
  }


  async open(): Promise<void> {

    await this.transferLink.click();

    await expect(
      this.fromAccount
    ).toBeVisible();

    await expect(
      this.toAccount
    ).toBeVisible();

    await expect
      .poll(async () => {
        return await this.fromAccount
          .locator('option')
          .count();
      })
      .toBeGreaterThan(0);
  }


  async getAvailableAccounts(): Promise<string[]> {

    const fromOptions =
      this.fromAccount.locator('option');

    const count =
      await fromOptions.count();

    if (count < 2) {

      throw new Error(
        'At least two accounts are required for fund transfer'
      );
    }

    const accounts: string[] = [];

    for (
      let index = 0;
      index < count;
      index++
    ) {

      const accountId =
        await fromOptions
          .nth(index)
          .getAttribute('value');

      if (accountId) {

        accounts.push(accountId);
      }
    }

    return accounts;
  }


  async getAccountBalance(
    accountId: string
  ): Promise<number> {

    const accountsOverviewLink =
      this.page.getByRole(
        'link',
        {
          name: /Accounts Overview/i
        }
      );

    await expect(
      accountsOverviewLink
    ).toBeVisible();

    await accountsOverviewLink.click();

    const accountLink =
      this.page.getByRole(
        'link',
        {
          name: accountId,
          exact: true
        }
      );

    await expect(
      accountLink
    ).toBeVisible();

    await accountLink.click();

    const balanceRow =
      this.page.locator(
        '#accountDetails tr'
      ).filter({
        hasText: 'Balance'
      }).first();

    const balanceText =
      await balanceRow
        .locator('td')
        .last()
        .innerText();

    const balance =
      Number(
        balanceText
          .replace('$', '')
          .replace(/,/g, '')
          .trim()
      );

    if (Number.isNaN(balance)) {

      throw new Error(
        `Unable to parse balance for account ${accountId}: ${balanceText}`
      );
    }

    return balance;
  }


  async selectTwoDifferentAccounts(): Promise<{ fromAccountId: string; toAccountId: string }> {

    await expect(
      this.fromAccount
    ).toBeVisible();

    await expect(
      this.toAccount
    ).toBeVisible();

    await expect
      .poll(async () => {
        return await this.fromAccount
          .locator('option')
          .count();
      })
      .toBeGreaterThan(0);

    await expect
      .poll(async () => {
        return await this.toAccount
          .locator('option')
          .count();
      })
      .toBeGreaterThan(1);

    const fromOptions =
      this.fromAccount.locator('option');

    const toOptions =
      this.toAccount.locator('option');

    const fromAccountId =
      await fromOptions
        .first()
        .getAttribute('value');

    if (!fromAccountId) {
      throw new Error(
        'Source account ID was not found'
      );
    }

    let toAccountId: string | null = null;

    const toCount =
      await toOptions.count();

    for (
      let index = 0;
      index < toCount;
      index++
    ) {

      const accountId =
        await toOptions
          .nth(index)
          .getAttribute('value');

      if (
        accountId &&
        accountId !== fromAccountId
      ) {

        toAccountId = accountId;
        break;
      }
    }

    if (!toAccountId) {
      throw new Error(
        'A different destination account was not found'
      );
    }

    await this.fromAccount.selectOption(
      fromAccountId
    );

    await this.toAccount.selectOption(
      toAccountId
    );

    return {
      fromAccountId,
      toAccountId
    };
  }

  async transfer(
    fromAccountId: string,
    toAccountId: string,
    transferAmount: string
  ): Promise<void> {

    await this.fromAccount
      .selectOption(
        fromAccountId
      );

    await this.toAccount
      .selectOption(
        toAccountId
      );

    await this.amount.fill(
      transferAmount
    );

    await this.transferButton.click();
  }


  async expectTransferComplete(): Promise<void> {

    await expect(
      this.page.getByText(
        /Transfer Complete/i
      )
    ).toBeVisible();
  }


  async getTransferReference(): Promise<string> {

    const confirmation =
      this.page.locator(
        '#rightPanel'
      );

    const confirmationText =
      await confirmation.innerText();

    const reference =
      confirmationText
        .match(
          /\d{4,}/
        );

    if (!reference) {

      throw new Error(
        'Transfer reference was not produced'
      );
    }

    return reference[0];
  }


  private parseCurrency(
    value: string
  ): number {

    return Number(
      value.replace(
        /[^0-9.-]/g,
        ''
      )
    );
  }
}