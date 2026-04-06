import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { productSchema } from "@/lib/validations/product";

import { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") throw new ForbiddenError();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    requireAdmin(session);
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) throw new NotFoundError("Product not found");

    return NextResponse.json(successResponse(product));
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

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Product not found");

    const body = await req.json();
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { variants, images, ...productData } = parsed.data;

    const product = await prisma.product.update({
      where: { id },
      data: productData,
    });

    return NextResponse.json(successResponse(product));
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

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Product not found");

    // Soft delete
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });

    return NextResponse.json(successResponse(null));
  } catch (err) {
    return handleApiError(err);
  }
}
