import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";

export default class CustomerApi {
  private apiClient: ApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }

  async getCustomer(customerId: number): Promise<APIResponse> {
    return await this.apiClient.get(`/customers/${customerId}`);
  }

  async getCustomerAccounts(customerId: number): Promise<APIResponse> {
    return await this.apiClient.get(`/customers/${customerId}/accounts`);
  }

  async getCustomerPositions(customerId: number): Promise<APIResponse> {
    return await this.apiClient.get(`/customers/${customerId}/positions`);
  }

  async updateCustomer(
    customerId: number,
    data: Record<string, string>,
  ): Promise<APIResponse> {
    return await this.apiClient.post(`/customers/update/${customerId}`, data);
  }
}
