import { NextRequest, NextResponse } from "next/server";
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
import { categoryUpdateSchema } from "@/lib/validations/category";
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundError("Category not found");

    return NextResponse.json(successResponse(category));
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

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Category not found");

    const body = await req.json();
    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid data");
    }

    const data = parsed.data;
    if (data.parentId === id) {
      throw new ValidationError("Category cannot be its own parent");
    }
    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new ValidationError("Parent category not found");
    }

    let nextSlug: string | undefined;
    if (data.slug !== undefined) {
      const s = data.slug.trim();
      nextSlug = s ? slugify(s) : slugify(existing.name);
      if (!nextSlug) throw new ValidationError("Invalid slug");
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(nextSlug !== undefined && { slug: nextSlug }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.image !== undefined && { image: data.image?.trim() || null }),
        ...(data.parentId !== undefined && { parentId: data.parentId || null }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json(successResponse(category));
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

    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new ValidationError(
        `Cannot delete: ${count} product(s) still use this category. Reassign them first.`
      );
    }

    const children = await prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      throw new ValidationError(
        "Cannot delete: child categories exist. Remove or reassign parent on them first."
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    return handleApiError(err);
  }
}
