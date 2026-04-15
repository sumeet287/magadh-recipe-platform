import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { paginatedResponse } from "@/lib/api-response";
import { productQuerySchema } from "@/lib/validations/product";
import { storefrontListingWhere } from "@/lib/storefront-products";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = productQuerySchema.safeParse(params);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const {
      page, limit, search, category, minPrice, maxPrice,
      spiceLevel, isVeg, isBestseller, isNewArrival, isFeatured,
      sort, tags,
    } = parsed.data;

    const clauses: Prisma.ProductWhereInput[] = [];

    if (search) {
      clauses.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { has: search } },
        ],
      });
    }
    if (category) clauses.push({ category: { slug: category } });
    if (tags) clauses.push({ tags: { hasSome: tags.split(",") } });
    if (spiceLevel) clauses.push({ spiceLevel });
    if (isVeg !== undefined) clauses.push({ isVeg });
    if (isBestseller) clauses.push({ isBestseller: true });
    if (isNewArrival) clauses.push({ isNewArrival: true });
    if (isFeatured) clauses.push({ isFeatured: true });

    const priceOpts =
      minPrice !== undefined || maxPrice !== undefined
        ? { minPrice, maxPrice }
        : {};

    const where = storefrontListingWhere(priceOpts, ...clauses);

    const skip = (page - 1) * limit;

    const orderByMap: Record<string, { createdAt?: "asc" | "desc"; sortOrder?: "asc" | "desc"; name?: "asc" | "desc" }> = {
      featured: { sortOrder: "asc" },
      newest: { createdAt: "desc" },
      price_asc: { sortOrder: "asc" },
      price_desc: { sortOrder: "asc" },
      rating: { createdAt: "desc" },
      popularity: { createdAt: "desc" },
    };
    const orderBy = orderByMap[sort] ?? { createdAt: "desc" };

    const variantSelect = {
      orderBy: { price: "asc" as const },
      where: { isActive: true, stock: { gt: 0 } },
      select: { id: true, name: true, price: true, mrp: true, stock: true, isDefault: true },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          variants: variantSelect,
          images: { orderBy: { sortOrder: "asc" }, select: { url: true, altText: true, isPrimary: true } },
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const mapped = products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
          : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        isVeg: p.isVeg,
        spiceLevel: p.spiceLevel,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        category: p.category,
        variants: p.variants,
        images: p.images,
        avgRating,
        reviewCount: p.reviews.length,
      };
    });

    const response = paginatedResponse(mapped, total, page, limit);
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
