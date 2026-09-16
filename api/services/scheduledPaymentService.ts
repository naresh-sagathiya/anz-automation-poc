import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../core/apiClient";

export default class ScheduledPaymentService {
  private readonly apiClient: ApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }

  list(token: string): Promise<APIResponse> {
    return this.apiClient.get("/scheduled-payments", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  create(token: string, data: unknown): Promise<APIResponse> {
    return this.apiClient.post("/scheduled-payments", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  cancel(token: string, id: string): Promise<APIResponse> {
    return this.apiClient.post(`/scheduled-payments/${id}/cancel`, undefined, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}