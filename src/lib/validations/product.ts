import { z } from "zod";

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name required"),
  weight: z.string().optional(),
  unit: z.string().optional(),
  sku: z.string().min(1, "SKU required"),
  mrp: z.number().positive("MRP must be positive"),
  price: z.number().positive("Price must be positive"),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  lowStockAlert: z.number().int().min(0).default(10),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name required").max(200),
  slug: z.string().min(2).max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  nutritionInfo: z.string().optional(),
  storageInstructions: z.string().optional(),
  shelfLife: z.string().optional(),
  usageSuggestions: z.string().optional(),
  categoryId: z.string().min(1, "Category required"),
  tags: z.array(z.string()).default([]),
  spiceLevel: z.enum(["MILD", "MEDIUM", "HOT", "EXTRA_HOT"]).default("MEDIUM"),
  region: z.string().optional(),
  isVeg: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISCONTINUED", "ARCHIVED"]).default("ACTIVE"),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
  variants: z.array(productVariantSchema).min(1, "At least one variant required"),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().min(1, "Image URL required"),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })).optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  spiceLevel: z.enum(["MILD", "MEDIUM", "HOT", "EXTRA_HOT"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isBestseller: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  isVeg: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(["featured", "newest", "price_asc", "price_desc", "rating", "popularity"]).default("featured"),
  tags: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
