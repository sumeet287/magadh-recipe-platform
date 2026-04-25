import { z } from "zod";

export const broadcastAudienceSchema = z.object({
  optedInOnly: z.boolean().default(true),
  includeUnverifiedPhone: z.boolean().default(false),
  limit: z.number().int().positive().max(50000).optional(),
});

export const broadcastCreateSchema = z.object({
  name: z.string().min(2).max(120),
  templateName: z.string().min(1).max(120),
  templateLanguage: z.string().min(2).max(10).default("en"),
  templateParams: z.array(z.string().max(1024)).default([]),
  audience: broadcastAudienceSchema,
});

export type BroadcastCreateInput = z.infer<typeof broadcastCreateSchema>;
export type BroadcastAudience = z.infer<typeof broadcastAudienceSchema>;
