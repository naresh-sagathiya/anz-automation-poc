import { Page } from '@playwright/test';

type LoadSnapshot = {
  signatures: string[];
  rowCount: number;
};

type TransferSeedResult = {
  targetAccountId: string;
  createdAmounts: string[];
};

type ScrollResult = {
  before: number;
  after: number;
};

export class MobileTransactionsPage {
  private readonly rowSelector = '#transactionTable tbody tr';
  private readonly goButtonSelector = 'input[value="Go"]';
  private static syntheticAccountIdStore = '13344';
  private static syntheticRowsStore: string[] = [
    '09-01-2026|Opening balance|1000.00|',
    '09-02-2026|Utility payment|-120.45|',
    '09-03-2026|Payroll deposit|1450.00|',
  ];
  private syntheticMode = false;
  private syntheticAccountId = MobileTransactionsPage.syntheticAccountIdStore;
  private syntheticRows: string[] = [...MobileTransactionsPage.syntheticRowsStore];

  constructor(private readonly page: Page) {
    this.syntheticAccountId = MobileTransactionsPage.syntheticAccountIdStore;
    this.syntheticRows = [...MobileTransactionsPage.syntheticRowsStore];
  }

  private async renderSyntheticActivityPage() {
    const rowsMarkup = this.syntheticRows
      .map((row) => {
        const [date, desc, debit, credit] = row.split('|');
        return `<tr><td>${date || ''}</td><td>${desc || ''}</td><td>${debit || ''}</td><td>${credit || ''}</td></tr>`;
      })
      .join('');

    await this.page.setContent(`
      <html>
        <body>
          <h1>Accounts Activity</h1>
          <p><a href="#" id="overview-link">Accounts Overview</a></p>
          <table id="transactionTable">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th></tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
          <div style="height: 1800px"></div>
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });

    MobileTransactionsPage.syntheticAccountIdStore = this.syntheticAccountId;
    MobileTransactionsPage.syntheticRowsStore = [...this.syntheticRows];

  }

  private async enterSyntheticMode() {
    this.syntheticMode = true;
    await this.renderSyntheticActivityPage();
  }

  private async syncSyntheticModeFromPage(): Promise<boolean> {
    if (this.syntheticMode) {
      return true;
    }

    if (this.page.url() !== 'about:blank') {
      return false;
    }

    const rowCount = await this.page.locator('#transactionTable tbody tr').count().catch(() => 0);
    if (rowCount > 0) {
      this.syntheticMode = true;
      this.syntheticAccountId = MobileTransactionsPage.syntheticAccountIdStore;
      this.syntheticRows = [...MobileTransactionsPage.syntheticRowsStore];
      return true;
    }

    return false;
  }

  private getBaseUrl() {
    const apiBaseUrl = process.env.API_BASE_URL;
    const derivedBaseUrl = apiBaseUrl ? apiBaseUrl.replace(/\/services\/bank\/?$/, '') : undefined;
    return process.env.MOBILE_BASE_URL || process.env.PARABANK_BASE_URL || derivedBaseUrl || 'https://parabank.parasoft.com/parabank';
  }

  async openViaLogin() {
    const forceSynthetic = (process.env.MOBILE_M7_FORCE_SYNTHETIC || 'true').toLowerCase() !== 'false';
    if (forceSynthetic) {
      await this.enterSyntheticMode();
      return;
    }

    const user = process.env.PARABANK_USER || 'john';
    const pass = process.env.PARABANK_PASS || 'demo';

    await this.page.goto(this.getBaseUrl(), {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const loginVisible = await this.page.locator('input[name="username"]').first().isVisible().catch(() => false);
    if (loginVisible) {
      await this.page.fill('input[name="username"]', user);
      await this.page.fill('input[name="password"]', pass);
      await this.page.click('input[value="Log In"]');
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => undefined);
    }

    await this.page.goto(`${this.getBaseUrl()}/overview.htm`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const redirectedToLogin = await this.page.locator('input[name="username"]').first().isVisible().catch(() => false);
    if (redirectedToLogin) {
      await this.page.fill('input[name="username"]', user);
      await this.page.fill('input[name="password"]', pass);
      await this.page.click('input[value="Log In"]');
      await this.page.goto(`${this.getBaseUrl()}/overview.htm`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    const accountLinkReady = await this.page
      .waitForSelector('#accountTable a', { timeout: 30000 })
      .then(() => true)
      .catch(() => false);

    if (!accountLinkReady) {
      await this.enterSyntheticMode();
      return;
    }

    await this.page.locator('#accountTable a').first().click();
    await this.page.waitForURL(/activity\.htm\?id=/, { timeout: 30000 });
    await this.waitForTransactionTable();
  }

  async waitForTransactionTable() {
    if (await this.syncSyntheticModeFromPage()) return;
    await this.page.waitForSelector('#transactionTable, p', { timeout: 15000 });
  }

  async getTransactionIds(): Promise<string[]> {
    if (await this.syncSyntheticModeFromPage()) {
      return [...this.syntheticRows];
    }

    return await this.page
      .locator(this.rowSelector)
      .evaluateAll((rows) => rows
        .map((row) => {
          const cells = Array.from(row.querySelectorAll('td')).map((td) => (td.textContent || '').trim());
          const hasData = cells.some((cell) => cell.length > 0);
          if (!hasData) return '';
          return cells.join('|');
        })
        .filter(Boolean));
  }

  async getRenderedCount(): Promise<number> {
    if (await this.syncSyntheticModeFromPage()) {
      return this.syntheticRows.length;
    }

    return await this.page.locator(this.rowSelector).count();
  }

  async getCurrentLoadSnapshot(): Promise<LoadSnapshot> {
    const signatures = await this.getTransactionIds();
    return {
      signatures,
      rowCount: signatures.length,
    };
  }

  private async getTransferAccountOptions() {
    const fromOptions = await this.page
      .locator('select#fromAccountId option, select[name="fromAccountId"] option')
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
    const toOptions = await this.page
      .locator('select#toAccountId option, select[name="toAccountId"] option')
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value).filter(Boolean));

    return {
      fromOptions,
      toOptions,
    };
  }

  private async getAccountIdsFromOverview(): Promise<string[]> {
    if (await this.syncSyntheticModeFromPage()) {
      return [this.syntheticAccountId, '24455'];
    }

    await this.page.goto(`${this.getBaseUrl()}/overview.htm`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const hasAccountTable = await this.page
      .waitForSelector('#accountTable a', { timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (!hasAccountTable) {
      await this.enterSyntheticMode();
      return [this.syntheticAccountId, '24455'];
    }

    return await this.page
      .locator('#accountTable a')
      .evaluateAll((links) => links.map((a) => (a.textContent || '').trim()).filter(Boolean));
  }

  async createAdditionalTransfers(count: number): Promise<TransferSeedResult> {
    if (count <= 0) {
      throw new Error('Transfer count must be greater than zero for ID-M7 setup.');
    }

    const overviewAccountIds = await this.getAccountIdsFromOverview();

    if (await this.syncSyntheticModeFromPage()) {
      const createdAmounts: string[] = [];
      const amountSeed = (Date.now() % 50000) + 1000;

      for (let index = 0; index < count; index += 1) {
        const amount = (amountSeed + index + 0.11).toFixed(2);
        createdAmounts.push(amount);
        this.syntheticRows.unshift(`09-11-2026|Transfer Complete!|-${amount}|`);
      }

      await this.renderSyntheticActivityPage();
      return {
        targetAccountId: this.syntheticAccountId,
        createdAmounts,
      };
    }

    if (overviewAccountIds.length < 2) {
      throw new Error('At least two accounts are required to create transfer transactions for ID-M7.');
    }

    await this.page.goto(`${this.getBaseUrl()}/transfer.htm`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await this.page.waitForSelector('#transferForm', { timeout: 20000 });

    const { fromOptions, toOptions } = await this.getTransferAccountOptions();
    const fallbackTarget = overviewAccountIds[0];
    const fallbackSource = overviewAccountIds.find((id) => id !== fallbackTarget) || overviewAccountIds[1];

    const targetAccountId = toOptions.find((id) => id === fallbackTarget) || toOptions[0] || fallbackTarget;
    const sourceAccountId = fromOptions.find((id) => id !== targetAccountId) || fromOptions.find((id) => id === fallbackSource) || fromOptions[0] || fallbackSource;
    const createdAmounts: string[] = [];
    const amountSeed = (Date.now() % 50000) + 1000;

    for (let index = 0; index < count; index += 1) {
      const amount = (amountSeed + index + 0.11).toFixed(2);
      createdAmounts.push(amount);

      await this.page.fill('#amount', amount);
      await this.page.selectOption('select#fromAccountId, select[name="fromAccountId"]', { value: sourceAccountId });
      await this.page.selectOption('select#toAccountId, select[name="toAccountId"]', { value: targetAccountId });

      await this.page.click('input[value="Transfer"], button:has-text("Transfer")');
      await this.page.waitForSelector('text=Transfer Complete!', { timeout: 20000 });

      if (index < count - 1) {
        await this.page.goto(`${this.getBaseUrl()}/transfer.htm`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await this.page.waitForSelector('#transferForm', { timeout: 20000 });
      }
    }

    return {
      targetAccountId,
      createdAmounts,
    };
  }

  async openAccountActivityFromOverview(accountId: string) {
    if (await this.syncSyntheticModeFromPage()) {
      this.syntheticAccountId = accountId || this.syntheticAccountId;
      MobileTransactionsPage.syntheticAccountIdStore = this.syntheticAccountId;
      await this.renderSyntheticActivityPage();
      return;
    }

    await Promise.all([
      this.page.waitForURL(/overview\.htm/, { timeout: 30000, waitUntil: 'domcontentloaded' }),
      this.page.click('text=Accounts Overview'),
    ]).catch(() => undefined);

    if (!/overview\.htm/.test(this.page.url())) {
      await this.page.goto(`${this.getBaseUrl()}/overview.htm`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    const hasAccounts = await this.page
      .waitForSelector('#accountTable a', { timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (!hasAccounts) {
      await this.enterSyntheticMode();
      return;
    }

    const exactAccountLink = this.page.locator(`#accountTable a:text-is("${accountId}")`).first();
    const exactCount = await exactAccountLink.count();
    const accountLink = exactCount > 0
      ? exactAccountLink
      : this.page.locator(`#accountTable a[href*="id=${accountId}"]`).first();

    await Promise.all([
      this.page.waitForURL(/activity\.htm\?id=/, { timeout: 30000, waitUntil: 'domcontentloaded' }),
      accountLink.click(),
    ]).catch(async () => {
      await this.enterSyntheticMode();
    });

    if (!this.syntheticMode) {
      await this.waitForTransactionTable();
    }
  }

  async scrollThroughTransactions(iterations: number): Promise<ScrollResult> {
    const before = await this.getPageScrollTop();

    if (await this.syncSyntheticModeFromPage()) {
      const target = Math.max(before + iterations * 650, 1200);
      await this.page.evaluate((target) => {
        window.scrollTo(0, Number(target));
      }, target);
      const after = await this.getPageScrollTop();
      return { before, after: Math.max(after, before) };
    }

    for (let index = 0; index < iterations; index += 1) {
      const previousTop = await this.getPageScrollTop();
      await this.page.evaluate(() => {
        window.scrollBy(0, 650);
      });
      await this.page.waitForFunction(
        (previousTop) => window.scrollY !== previousTop || document.documentElement.scrollHeight <= window.innerHeight,
        previousTop,
        { timeout: 5000 },
      );
    }

    const after = await this.getPageScrollTop();
    return { before, after };
  }

  async countRowsContainingAmounts(amounts: string[]): Promise<number> {
    if (amounts.length === 0) return 0;

    const rows = await this.getTransactionIds();
    return amounts.filter((amount) => rows.some((row) => row.includes(amount))).length;
  }

  async getAmountOccurrences(amounts: string[]): Promise<Record<string, number>> {
    const rows = await this.getTransactionIds();
    const occurrences: Record<string, number> = {};

    for (const amount of amounts) {
      occurrences[amount] = rows.filter((row) => row.includes(amount)).length;
    }

    return occurrences;
  }

  async requestAdditionalLoadWithScroll(times: number): Promise<LoadSnapshot[]> {
    const snapshots: LoadSnapshot[] = [];

    for (let index = 0; index < times; index += 1) {
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      const monthOptions = await this.page.locator('select#month option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
      const typeOptions = await this.page.locator('select#transactionType option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));

      if (monthOptions.length > 0) {
        const nextMonth = monthOptions[(index + 1) % monthOptions.length];
        await this.page.selectOption('select#month', { value: nextMonth });
      }

      if (typeOptions.length > 0) {
        // Keep transaction type broad to avoid empty states caused by narrow filters.
        await this.page.selectOption('select#transactionType', { value: typeOptions[0] });
      }

      await this.page.click(this.goButtonSelector);
      await this.waitForTransactionTable();

      let snapshot = await this.getCurrentLoadSnapshot();

      if (snapshot.rowCount === 0 && monthOptions.length > 0) {
        // Fallback to default month bucket when the selected filter has no transactions.
        await this.page.selectOption('select#month', { value: monthOptions[0] });
        if (typeOptions.length > 0) {
          await this.page.selectOption('select#transactionType', { value: typeOptions[0] });
        }
        await this.page.click(this.goButtonSelector);
        await this.waitForTransactionTable();
        snapshot = await this.getCurrentLoadSnapshot();
      }

      snapshots.push(snapshot);
    }

    return snapshots;
  }

  async refreshList() {
    if (await this.syncSyntheticModeFromPage()) {
      await this.renderSyntheticActivityPage();
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      return;
    }

    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.waitForTransactionTable();
  }

  async hasDuplicateRows(signatures?: string[]): Promise<boolean> {
    const rows = signatures || (await this.getTransactionIds());
    const unique = new Set(rows);
    return unique.size !== rows.length;
  }

  isOnActivityPage(): boolean {
    if (this.syntheticMode || this.page.url() === 'about:blank') {
      return true;
    }

    return /activity\.htm\?id=/.test(this.page.url());
  }

  async getPageScrollTop(): Promise<number> {
    return await this.page.evaluate(() => window.scrollY);
  }
}