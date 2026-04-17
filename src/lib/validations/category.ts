import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(5000).optional().nullable(),
  image: z.string().max(2000).optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999_999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
