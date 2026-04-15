import type { Prisma } from "@prisma/client";

/** Variant must be sellable on storefront listings (optionally within a price band). */
export function inStockVariantWhere(
  minPrice?: number,
  maxPrice?: number
): Prisma.ProductVariantWhereInput {
  const v: Prisma.ProductVariantWhereInput = { isActive: true, stock: { gt: 0 } };
  if (minPrice !== undefined || maxPrice !== undefined) {
    v.price = {};
    if (minPrice !== undefined) v.price.gte = minPrice;
    if (maxPrice !== undefined) v.price.lte = maxPrice;
  }
  return v;
}

export function storefrontListingWhere(
  options: { minPrice?: number; maxPrice?: number } = {},
  ...clauses: Prisma.ProductWhereInput[]
): Prisma.ProductWhereInput {
  return {
    AND: [
      { status: "ACTIVE", isActive: true },
      { variants: { some: inStockVariantWhere(options.minPrice, options.maxPrice) } },
      ...clauses,
    ],
  };
}
