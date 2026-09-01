import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";
import {
  LoginRequest,
  LoginResponse,
  MfaVerifyRequest,
} from "../models/auth.model";

export default class AuthService {
  private readonly apiClient: ApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }

  private async withRetry<T>(
    action: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 250,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Auth request failed after retries");
  }

  private async ensureSuccess(
    response: APIResponse,
    context: string,
  ): Promise<APIResponse> {
    if (response.ok()) {
      return response;
    }

    let errorBody: unknown = {};

    try {
      errorBody = await response.json();
    } catch {
      // ignore JSON parsing errors for non-JSON error responses
    }

    const message =
      typeof errorBody === "object" && errorBody !== null && "message" in errorBody
        ? String((errorBody as { message?: string }).message)
        : "";

    throw new Error(
      `${context} failed with status ${response.status()}${message ? `: ${message}` : ""}`,
    );
  }

  async login(username: string, password: string): Promise<APIResponse> {
    const payload: LoginRequest = {
      username,
      password,
    };

    return this.withRetry(async () => {
      const response = await this.apiClient.post("/auth/login", payload, {
        "Content-Type": "application/json",
      });

      return this.ensureSuccess(response, "Login");
    });
  }

  async loginAndGetBody(
    username: string,
    password: string,
  ): Promise<{
    response: APIResponse;
    body: LoginResponse;
  }> {
    const response = await this.login(username, password);
    const body = (await response.json()) as LoginResponse;

    return {
      response,
      body,
    };
  }

  async createMfaChallenge(accessToken: string): Promise<APIResponse> {
    return this.withRetry(async () => {
      const response = await this.apiClient.post("/auth/mfa/challenge", undefined, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return this.ensureSuccess(response, "MFA challenge creation");
    });
  }

  async verifyMfa(
    accessToken: string,
    challengeId: string,
    challengeToken: string,
    code: string,
  ): Promise<APIResponse> {
    const payload: MfaVerifyRequest = {
      challengeId,
      challengeToken,
      code,
    };

    return this.withRetry(async () => {
      const response = await this.apiClient.post("/auth/mfa/verify", payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return this.ensureSuccess(response, "MFA verification");
    });
  }

  async refreshToken(refreshToken: string): Promise<APIResponse> {
    return this.withRetry(async () => {
      const response = await this.apiClient.post("/auth/token/refresh", {
        refreshToken,
      });

      return this.ensureSuccess(response, "Token refresh");
    });
  }

  async revokeToken(accessToken: string, token: string): Promise<APIResponse> {
    return this.withRetry(async () => {
      const response = await this.apiClient.post(
        "/auth/token/revoke",
        {
          token,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return this.ensureSuccess(response, "Token revoke");
    });
  }

  async getCustomer(
    customerId: string,
    accessToken: string,
  ): Promise<APIResponse> {
    return this.withRetry(async () => {
      const response = await this.apiClient.get(`/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return this.ensureSuccess(response, "Get customer");
    });
  }
}
