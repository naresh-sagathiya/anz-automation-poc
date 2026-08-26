import { Page } from 'playwright';

export class MobileTransferPage {
  constructor(private readonly page: Page) {}

  async fillTransfer(amount: string, fromAccount: string, toAccount: string) {
    await this.page.waitForSelector('#transferForm', { timeout: 20000 });
    await this.page.waitForSelector('#amount', { timeout: 20000 });
    await this.page.waitForFunction(() => {
      const fromSelect = document.querySelector('#fromAccountId') as HTMLSelectElement | null;
      const toSelect = document.querySelector('#toAccountId') as HTMLSelectElement | null;
      return !!fromSelect && !!toSelect && fromSelect.options.length > 1 && toSelect.options.length > 1;
    }, { timeout: 30000 });

    const actualFromValues = await this.page.locator('#fromAccountId option').evaluateAll((opts) => opts.map((o) => o.value));
    const actualToValues = await this.page.locator('#toAccountId option').evaluateAll((opts) => opts.map((o) => o.value));

    const resolvedFrom = actualFromValues.includes(fromAccount) ? fromAccount : actualFromValues[1] || actualFromValues[0];
    const resolvedTo = actualToValues.includes(toAccount) && toAccount !== resolvedFrom ? toAccount : actualToValues.find((value) => value !== resolvedFrom) || actualToValues[1] || actualToValues[0];

    await this.page.fill('#amount', amount);

    await this.page.selectOption('#fromAccountId', { value: resolvedFrom });
    await this.page.selectOption('#toAccountId', { value: resolvedTo });
  }

  async submit() {
    const transferButton = this.page.locator('input[value="Transfer"]');
    await transferButton.waitFor({ state: 'visible', timeout: 20000 });
    await transferButton.click({ force: true });
    await this.page.waitForFunction(() => {
      const showResult = document.querySelector('#showResult');
      const showError = document.querySelector('#showError');
      return !!(showResult && (showResult as HTMLElement).style.display !== 'none') || !!(showError && (showError as HTMLElement).style.display !== 'none');
    }, { timeout: 30000 });
  }
}
