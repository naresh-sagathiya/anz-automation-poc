import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";
import { LoginRequest, LoginResponse } from "../models/auth.model";

export default class AuthService {
  private readonly apiClient: ApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }

  async login(username: string, password: string): Promise<APIResponse> {
    const payload: LoginRequest = {
      username,
      password,
    };

    return await this.apiClient.post("/auth/login", payload, {
      "Content-Type": "application/json",
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
    return await this.apiClient.post("/auth/mfa/challenge", undefined, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async verifyMfa(
    accessToken: string,
    challengeId: string,
    challengeToken: string,
    code: string,
  ): Promise<APIResponse> {
    return await this.apiClient.post(
      "/auth/mfa/verify",
      {
        challengeId,
        challengeToken,
        code,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  async refreshToken(refreshToken: string): Promise<APIResponse> {
    return await this.apiClient.post("/auth/token/refresh", {
      refreshToken,
    });
  }

  async revokeToken(accessToken: string, token: string): Promise<APIResponse> {
    return await this.apiClient.post(
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
  }

  async getCustomer(
    customerId: string,
    accessToken: string,
  ): Promise<APIResponse> {
    return await this.apiClient.get(`/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}
