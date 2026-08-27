import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";

export class AccountService {
  private readonly apiClient: ApiClient;
  constructor(request: APIRequestContext) { this.apiClient = new ApiClient(request); }
  // These are relative (no leading slash) so Playwright preserves the /services/bank base path.
  async login(username: string, password: string): Promise<APIResponse> { return this.apiClient.get(`login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`); }
  async getAccounts(customerId: number): Promise<APIResponse> { return this.apiClient.get(`customers/${customerId}/accounts`); }
  async getAccount(accountId: number): Promise<APIResponse> { return this.apiClient.get(`accounts/${accountId}`); }
  async getTransactions(accountId: number): Promise<APIResponse> { return this.apiClient.get(`accounts/${accountId}/transactions`); }
  async getTransactionsByAmount(accountId: number, amount: number): Promise<APIResponse> { return this.apiClient.get(`accounts/${accountId}/transactions/amount/${amount}`); }
}
