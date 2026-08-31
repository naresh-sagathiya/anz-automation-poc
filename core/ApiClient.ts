import { APIRequestContext, APIResponse } from "@playwright/test";

import { APILogger } from "../utils/logger";
import { withRetry, RetryOptions } from "../utils/retry";

export default class ApiClient {
  constructor(protected request: APIRequestContext) {}

  async get(endpoint: string, options?: any): Promise<APIResponse> {
    APILogger.request("GET", endpoint);

    const response = await this.request.get(endpoint, options);

    APILogger.response(response.status(), endpoint);

    return response;
  }

  async getWithRetry(
    endpoint: string,
    options?: any,
    retryOptions?: RetryOptions,
  ): Promise<APIResponse> {
    return withRetry(() => this.get(endpoint, options), retryOptions);
  }

  async post(
    endpoint: string,
    data?: any,
    options?: any,
  ): Promise<APIResponse> {
    APILogger.request("POST", endpoint);

    const response = await this.request.post(endpoint, {
      ...(data !== undefined ? { data } : {}),
      ...options,
    });

    APILogger.response(response.status(), endpoint);

    return response;
  }

  async put(endpoint: string, data?: any, options?: any): Promise<APIResponse> {
    APILogger.request("PUT", endpoint);

    const response = await this.request.put(endpoint, {
      ...(data !== undefined ? { data } : {}),
      ...options,
    });

    APILogger.response(response.status(), endpoint);

    return response;
  }

  async patch(
    endpoint: string,
    data?: any,
    options?: any,
  ): Promise<APIResponse> {
    APILogger.request("PATCH", endpoint);

    const response = await this.request.patch(endpoint, {
      ...(data !== undefined ? { data } : {}),
      ...options,
    });

    APILogger.response(response.status(), endpoint);

    return response;
  }

  async delete(endpoint: string, options?: any): Promise<APIResponse> {
    APILogger.request("DELETE", endpoint);

    const response = await this.request.delete(endpoint, options);

    APILogger.response(response.status(), endpoint);

    return response;
  }
}
