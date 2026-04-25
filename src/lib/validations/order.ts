import { z } from "zod";

export const addressShape = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter valid 6-digit pincode"),
  country: z.string().default("India"),
});

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    quantity: z.number().int().min(1).max(10),
  })).min(1),
  addressId: z.string().optional(),
  address: addressShape.optional(),
  paymentMethod: z.enum(["RAZORPAY", "UPI"]).default("RAZORPAY"),
  couponCode: z.string().optional(),
  giftNote: z.string().max(500).optional(),
  isGiftOrder: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  checkoutSessionId: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().min(1),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1, "Coupon code required").max(50).toUpperCase(),
  subtotal: z.number().positive(),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CouponValidateInput = z.infer<typeof couponValidateSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
