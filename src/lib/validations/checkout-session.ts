import { z } from "zod";

const itemSnapshot = z.object({
  productId: z.string(),
  variantId: z.string(),
  productName: z.string(),
  variantName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  imageUrl: z.string().optional().nullable(),
});

export const checkoutSessionStartSchema = z.object({
  sessionId: z.string().optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .optional()
    .or(z.literal(""))
    .nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  name: z.string().optional().or(z.literal("")).nullable(),
  items: z.array(itemSnapshot).min(1),
  totalAmount: z.number().nonnegative(),
});

export const checkoutSessionHeartbeatSchema = z.object({
  sessionId: z.string(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .optional()
    .or(z.literal(""))
    .nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  name: z.string().optional().or(z.literal("")).nullable(),
});

export type CheckoutSessionStartInput = z.infer<typeof checkoutSessionStartSchema>;
export type CheckoutSessionHeartbeatInput = z.infer<typeof checkoutSessionHeartbeatSchema>;
export type CheckoutItemSnapshot = z.infer<typeof itemSnapshot>;
