import { z } from "zod";

const faqItemSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(4000),
});

export const blogPostCreateSchema = z.object({
  slug: z.string().min(1).max(200).optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(240),
  subtitle: z.string().max(240).optional().nullable(),
  excerpt: z.string().max(600).optional().nullable(),
  content: z.string().min(1, "Content is required").max(200_000),
  coverImage: z.string().url().max(2000).optional().nullable().or(z.literal("")),
  coverImageAlt: z.string().max(240).optional().nullable(),
  categoryId: z.string().optional().nullable().or(z.literal("")),
  tags: z.array(z.string().max(64)).max(25).default([]),
  readTimeMinutes: z.coerce.number().int().min(1).max(300).optional().nullable(),
  authorName: z.string().max(120).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  publishedAt: z.coerce.date().optional().nullable(),
  metaTitle: z.string().max(240).optional().nullable(),
  metaDesc: z.string().max(320).optional().nullable(),
  metaKeywords: z.string().max(480).optional().nullable(),
  ogImage: z.string().url().max(2000).optional().nullable().or(z.literal("")),
  schemaType: z.enum(["ARTICLE", "RECIPE", "HOWTO"]).default("ARTICLE"),
  recipeYield: z.string().max(120).optional().nullable(),
  prepTimeMinutes: z.coerce.number().int().min(0).max(2000).optional().nullable(),
  cookTimeMinutes: z.coerce.number().int().min(0).max(2000).optional().nullable(),
  recipeCuisine: z.string().max(120).optional().nullable(),
  recipeCategoryName: z.string().max(120).optional().nullable(),
  recipeIngredients: z.array(z.string().max(500)).max(60).default([]),
  recipeInstructions: z.array(z.string().max(2000)).max(60).default([]),
  faqs: z.array(faqItemSchema).max(30).optional().nullable(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial();

export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

export const blogCategoryCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999_999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export type BlogCategoryCreateInput = z.infer<typeof blogCategoryCreateSchema>;
