import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";

export default class PayeeService {
  private readonly apiClient: ApiClient;
  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }
  list(token: string): Promise<APIResponse> {
    return this.apiClient.get("/payees", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  listForCustomer(token: string, customerId: string): Promise<APIResponse> {
    return this.apiClient.get(`/customers/${customerId}/payees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  create(token: string, data: unknown): Promise<APIResponse> {
    return this.apiClient.post("/payees", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  get(token: string, id: string): Promise<APIResponse> {
    return this.apiClient.get(`/payees/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  update(token: string, id: string, data: unknown): Promise<APIResponse> {
    return this.apiClient.put(`/payees/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  delete(token: string, id: string): Promise<APIResponse> {
    return this.apiClient.delete(`/payees/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
