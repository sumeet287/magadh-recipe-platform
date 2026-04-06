import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  addressLine1: z.string().min(5, "Address is required").max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter valid 6-digit pincode"),
  country: z.string().default("India"),
  type: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
