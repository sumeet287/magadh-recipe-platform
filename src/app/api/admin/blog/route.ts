import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { blogPostCreateSchema } from "@/lib/validations/blog";
import { slugify } from "@/lib/utils";
import type { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new ForbiddenError();
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const where: Prisma.BlogPostWhereInput = {};
    if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      where.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json(successResponse(posts));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const body = await req.json();
    const parsed = blogPostCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid data");
    }

    const d = parsed.data;
    const slug = (d.slug && d.slug.trim() ? d.slug : slugify(d.title)).toLowerCase();
    if (!slug) throw new ValidationError("Could not generate a valid slug from title");

    const publishedAt =
      d.status === "PUBLISHED" ? d.publishedAt ?? new Date() : d.publishedAt ?? null;

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: d.title.trim(),
        subtitle: d.subtitle?.trim() || null,
        excerpt: d.excerpt?.trim() || null,
        content: d.content,
        coverImage: d.coverImage?.trim() || null,
        coverImageAlt: d.coverImageAlt?.trim() || null,
        categoryId: d.categoryId?.trim() || null,
        tags: d.tags ?? [],
        readTimeMinutes: d.readTimeMinutes ?? null,
        authorName: d.authorName?.trim() || "Magadh Recipe",
        status: d.status,
        publishedAt,
        metaTitle: d.metaTitle?.trim() || null,
        metaDesc: d.metaDesc?.trim() || null,
        metaKeywords: d.metaKeywords?.trim() || null,
        ogImage: d.ogImage?.trim() || null,
        schemaType: d.schemaType,
        recipeYield: d.recipeYield?.trim() || null,
        prepTimeMinutes: d.prepTimeMinutes ?? null,
        cookTimeMinutes: d.cookTimeMinutes ?? null,
        recipeCuisine: d.recipeCuisine?.trim() || null,
        recipeCategoryName: d.recipeCategoryName?.trim() || null,
        recipeIngredients: d.recipeIngredients ?? [],
        recipeInstructions: d.recipeInstructions ?? [],
        faqs: (d.faqs ?? null) as unknown as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json(successResponse(post), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
