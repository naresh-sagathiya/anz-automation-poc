import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";

export default class DataFactoryService {
  private readonly apiClient: ApiClient;
  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }
  seed(token: string): Promise<APIResponse> {
    return this.apiClient.post(
      "/test-data/seed",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }
  cleanup(token: string, customerId: string): Promise<APIResponse> {
    return this.apiClient.delete(`/test-data/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
