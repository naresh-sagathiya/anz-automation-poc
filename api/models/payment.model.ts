import { z } from "zod";
import { isoDateSchema } from "../../utils/schema";
export const paymentSchema = z
  .object({
    paymentId: z.string(),
    status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
    amount: z.number(),
    currency: z.literal("AUD"),
    createdAt: isoDateSchema,
    fromAccountId: z.string(),
    toAccountId: z.string(),
    reference: z.string(),
  })
  .strict();

export const errorSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    errors: z.array(z.object({ field: z.string(), message: z.string() })),
  })
  .strict();

export const payeeSchema = z
  .object({
    payeeId: z.string(),
    name: z.string(),
    bsb: z.string().regex(/^\d{6}$/),
    accountNumber: z.string(),
    createdAt: isoDateSchema,
  })
  .strict();

export const customerSchema = z
  .object({
    customerId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
  })
  .strict();
export const accountSchema = z
  .object({
    accountId: z.string(),
    accountNumber: z.string(),
    customerId: z.string(),
    accountType: z.string(),
    currency: z.literal("AUD"),
    balance: z.number(),
    currentBalance: z.number(),
    availableBalance: z.number(),
    pendingBalance: z.number(),
  })
  .strict();
export const transactionSchema = z
  .object({
    transactionId: z.string(),
    accountId: z.string(),
    type: z.enum(["CREDIT", "DEBIT"]),
    amount: z.number(),
    currency: z.literal("AUD"),
    description: z.string(),
    occurredAt: isoDateSchema,
  })
  .strict();
export const transactionPageSchema = z
  .object({
    items: z.array(transactionSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  })
  .strict();
