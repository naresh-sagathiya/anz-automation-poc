import { APIRequestContext, APIResponse } from "@playwright/test";
import ApiClient from "../../core/ApiClient";
import { withRetry } from "../../utils/retry";

export default class BankingPaymentService {
  private readonly apiClient: ApiClient;

  constructor(request: APIRequestContext) {
    this.apiClient = new ApiClient(request);
  }

  create(
    accessToken: string,
    payload: unknown,
    idempotencyKey?: string,
  ): Promise<APIResponse> {
    return this.apiClient.post("/payments", payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
    });
  }

  getStatus(accessToken: string, paymentId: string): Promise<APIResponse> {
    return this.apiClient.get(`/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  getAudit(accessToken: string, paymentId: string): Promise<APIResponse> {
    return this.apiClient.get(`/payments/${paymentId}/audit`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  updateStatus(
    accessToken: string,
    paymentId: string,
    status: "PENDING" | "COMPLETED" | "FAILED",
  ): Promise<APIResponse> {
    return withRetry(
      () =>
        this.apiClient.post(
          `/payments/${paymentId}/status`,
          { status },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      { attempts: 2 },
    );
  }

  probeRateLimit(accessToken: string, key: string): Promise<APIResponse> {
    return withRetry(
      () =>
        this.apiClient.get("/rate-limit/probe", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Test-Key": key,
          },
        }),
      { attempts: 4 },
    );
  }
}
