import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from "@/lib/errors";
import { successResponse, paginatedResponse } from "@/lib/api-response";
import { productSchema } from "@/lib/validations/product";
import { slugify } from "@/lib/utils";

import { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") throw new ForbiddenError();
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
    const search = req.nextUrl.searchParams.get("search") ?? "";
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          variants: { orderBy: { price: "asc" }, take: 1 },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(products, total, page, limit));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const slug = parsed.data.slug ?? slugify(parsed.data.name);

    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        slug,
        variants: parsed.data.variants
          ? { create: parsed.data.variants }
          : undefined,
        images: parsed.data.images
          ? { create: parsed.data.images }
          : undefined,
      },
    });

    return NextResponse.json(successResponse(product), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
