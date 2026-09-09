import { APIResponse } from "@playwright/test";

export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  retryStatuses?: number[];
};

export async function withRetry(
  operation: () => Promise<APIResponse>,
  options: RetryOptions = {},
): Promise<APIResponse> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const retryStatuses = new Set(options.retryStatuses ?? [429, 502, 503, 504]);
  let response = await operation();

  for (
    let attempt = 1;
    attempt < attempts && retryStatuses.has(response.status());
    attempt += 1
  ) {
    const retryAfter = Number(response.headers()["retry-after"]);
    const delayMs =
      Number.isFinite(retryAfter) && retryAfter >= 0
        ? retryAfter * 1000
        : baseDelayMs * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    response = await operation();
  }

  return response;
}
