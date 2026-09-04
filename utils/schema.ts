import { z } from "zod";
import { parseIsoDate } from "./date";

export const isoDateSchema = z
  .string()
  .refine(
    (value) => {
      try {
        parseIsoDate(value);
        return true;
      } catch {
        return false;
      }
    },
    "Expected an ISO-compatible date",
  );

export function parseSchema<T>(
  schema: z.ZodType<T>,
  body: unknown,
  name: string,
): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(
      `${name} schema validation failed: ${result.error.message}`,
    );
  }
  return result.data;
}

export function assertNoSensitiveFields(
  body: unknown,
  fields = ["password", "accessToken", "refreshToken"],
): void {
  const serialized = JSON.stringify(body).toLowerCase();
  for (const field of fields) {
    if (serialized.includes(field.toLowerCase())) {
      throw new Error(`Sensitive field '${field}' was found in response`);
    }
  }
}
