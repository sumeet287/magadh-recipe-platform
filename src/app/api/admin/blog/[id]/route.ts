import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { blogPostUpdateSchema } from "@/lib/validations/blog";
import { slugify } from "@/lib/utils";
import type { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new ForbiddenError();
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAdmin(session);
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!post) throw new NotFoundError("Blog post");
    return NextResponse.json(successResponse(post));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAdmin(session);
    const { id } = await params;

    const body = await req.json();
    const parsed = blogPostUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid data");
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Blog post");

    const d = parsed.data;

    // If status flips to PUBLISHED and no publishedAt was set, stamp now.
    let publishedAt: Date | null | undefined = d.publishedAt ?? undefined;
    if (d.status === "PUBLISHED" && !existing.publishedAt && !publishedAt) {
      publishedAt = new Date();
    }

    // Build a narrow, Prisma-safe update payload with explicit null vs undefined handling.
    const data: Prisma.BlogPostUpdateInput = {};
    if (d.slug !== undefined) {
      const slug = (d.slug && d.slug.trim() ? d.slug : slugify(d.title ?? existing.title)).toLowerCase();
      if (!slug) throw new ValidationError("Could not generate a valid slug");
      data.slug = slug;
    }
    if (d.title !== undefined) data.title = d.title.trim();
    if (d.subtitle !== undefined) data.subtitle = d.subtitle?.trim() || null;
    if (d.excerpt !== undefined) data.excerpt = d.excerpt?.trim() || null;
    if (d.content !== undefined) data.content = d.content;
    if (d.coverImage !== undefined) data.coverImage = d.coverImage?.trim() || null;
    if (d.coverImageAlt !== undefined) data.coverImageAlt = d.coverImageAlt?.trim() || null;
    if (d.categoryId !== undefined) {
      data.category = d.categoryId?.trim()
        ? { connect: { id: d.categoryId.trim() } }
        : { disconnect: true };
    }
    if (d.tags !== undefined) data.tags = d.tags;
    if (d.readTimeMinutes !== undefined) data.readTimeMinutes = d.readTimeMinutes ?? null;
    if (d.authorName !== undefined) data.authorName = d.authorName?.trim() || "Magadh Recipe";
    if (d.status !== undefined) data.status = d.status;
    if (publishedAt !== undefined) data.publishedAt = publishedAt;
    if (d.metaTitle !== undefined) data.metaTitle = d.metaTitle?.trim() || null;
    if (d.metaDesc !== undefined) data.metaDesc = d.metaDesc?.trim() || null;
    if (d.metaKeywords !== undefined) data.metaKeywords = d.metaKeywords?.trim() || null;
    if (d.ogImage !== undefined) data.ogImage = d.ogImage?.trim() || null;
    if (d.schemaType !== undefined) data.schemaType = d.schemaType;
    if (d.recipeYield !== undefined) data.recipeYield = d.recipeYield?.trim() || null;
    if (d.prepTimeMinutes !== undefined) data.prepTimeMinutes = d.prepTimeMinutes ?? null;
    if (d.cookTimeMinutes !== undefined) data.cookTimeMinutes = d.cookTimeMinutes ?? null;
    if (d.recipeCuisine !== undefined) data.recipeCuisine = d.recipeCuisine?.trim() || null;
    if (d.recipeCategoryName !== undefined) data.recipeCategoryName = d.recipeCategoryName?.trim() || null;
    if (d.recipeIngredients !== undefined) data.recipeIngredients = d.recipeIngredients;
    if (d.recipeInstructions !== undefined) data.recipeInstructions = d.recipeInstructions;
    if (d.faqs !== undefined) {
      data.faqs = (d.faqs ?? null) as unknown as Prisma.InputJsonValue;
    }

    const post = await prisma.blogPost.update({ where: { id }, data });
    return NextResponse.json(successResponse(post));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAdmin(session);
    const { id } = await params;

    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    return handleApiError(err);
  }
}
