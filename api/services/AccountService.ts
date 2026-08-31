import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";

export class AccountService {
  private readonly apiClient: ApiClient;
  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }
  async getAccounts(
    customerId: string,
    accessToken: string,
  ): Promise<APIResponse> {
    return this.apiClient.get(`/customers/${customerId}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
  async getAccount(
    accountId: string,
    accessToken: string,
  ): Promise<APIResponse> {
    return this.apiClient.get(`/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
  async getTransactions(
    accountId: string,
    accessToken: string,
    query?: Record<string, string | number>,
  ): Promise<APIResponse> {
    return this.apiClient.get(`/accounts/${accountId}/transactions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: query,
    });
  }
}
