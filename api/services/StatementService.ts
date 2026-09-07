import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";

export default class StatementService {
  private readonly apiClient: ApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }

  get(token: string, accountId: string): Promise<APIResponse> {
    return this.apiClient.get(`/accounts/${accountId}/statements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}