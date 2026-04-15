import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { storefrontListingWhere } from "@/lib/storefront-products";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim();
    const limitParam = parseInt(searchParams.get("limit") ?? "12");
    const limit = Math.min(Math.max(limitParam, 1), 50);

    if (!q || q.length < 2) throw new ValidationError("Query must be at least 2 characters");

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`search:${ip}`, RATE_LIMITS.general)) {
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
    }

    const searchClause = {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { shortDescription: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { tags: { has: q } },
        { category: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    };

    const listWhere = storefrontListingWhere({}, searchClause);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: listWhere,
        include: {
          category: { select: { name: true, slug: true } },
          variants: {
            where: { isActive: true, stock: { gt: 0 } },
            orderBy: { price: "asc" },
            take: 1,
          },
          images: { where: { isPrimary: true }, take: 1 },
          reviews: { select: { rating: true } },
        },
        take: limit,
      }),
      prisma.product.count({ where: listWhere }),
    ]);

    const mapped = products.map((p) => {
      const variant = p.variants[0];
      const avgRating = p.reviews.length
        ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images[0]?.url,
        price: variant?.price ?? 0,
        mrp: variant?.mrp ?? 0,
        stock: variant?.stock ?? 0,
        isVeg: p.isVeg,
        spiceLevel: p.spiceLevel,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        category: { name: p.category.name, slug: p.category.slug },
        variantId: variant?.id,
        avgRating,
        reviewCount: p.reviews.length,
      };
    });

    return NextResponse.json(successResponse({ products: mapped, total }));
  } catch (err) {
    return handleApiError(err);
  }
}
