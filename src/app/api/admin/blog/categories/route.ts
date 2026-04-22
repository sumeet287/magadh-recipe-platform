import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { blogCategoryCreateSchema } from "@/lib/validations/blog";
import { slugify } from "@/lib/utils";
import type { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new ForbiddenError();
  }
}

export async function GET() {
  try {
    const session = await auth();
    requireAdmin(session);

    const categories = await prisma.blogCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { posts: true } } },
    });
    return NextResponse.json(successResponse(categories));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const body = await req.json();
    const parsed = blogCategoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid data");
    }

    const { name, slug: rawSlug, description, sortOrder, isActive } = parsed.data;
    const slug = (rawSlug && rawSlug.trim() ? rawSlug : slugify(name)).toLowerCase();
    if (!slug) throw new ValidationError("Could not generate a valid slug");

    const category = await prisma.blogCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        sortOrder,
        isActive,
      },
    });
    return NextResponse.json(successResponse(category), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
