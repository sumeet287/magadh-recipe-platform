import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
  images: z.array(z.string().url()).max(5).default([]),
  orderId: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid phone number")
    .optional()
    .or(z.literal("")),
  subject: z.string().min(5, "Subject is required").max(200),
  message: z.string().min(20, "Please provide more details").max(2000),
});

export const newsletterSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
