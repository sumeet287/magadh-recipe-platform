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

    // Update product in a transaction with variants and images
    const product = await prisma.$transaction(async (tx) => {
      // Update product base data
      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData,
      });

      // Handle variants if provided
      if (variants && variants.length > 0) {
        // Get existing variant IDs
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id },
          select: { id: true },
        });
        const existingIds = existingVariants.map((v) => v.id);
        const incomingIds = variants.filter((v) => v.id).map((v) => v.id!);

        // Delete removed variants
        const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert variants
        for (const variant of variants) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                name: variant.name,
                sku: variant.sku,
                mrp: variant.mrp,
                price: variant.price,
                stock: variant.stock,
                unit: variant.unit,
                isDefault: variant.isDefault,
                sortOrder: variant.sortOrder,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: variant.name,
                sku: variant.sku,
                mrp: variant.mrp,
                price: variant.price,
                stock: variant.stock ?? 0,
                unit: variant.unit,
                isDefault: variant.isDefault ?? false,
                sortOrder: variant.sortOrder ?? 0,
              },
            });
          }
        }
      }

      // Handle images if provided
      if (images && images.length > 0) {
        // Get existing image IDs
        const existingImages = await tx.productImage.findMany({
          where: { productId: id },
          select: { id: true },
        });
        const existingIds = existingImages.map((img) => img.id);
        const incomingIds = images.filter((img) => img.id).map((img) => img.id!);

        // Delete removed images
        const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.productImage.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert images
        for (const img of images) {
          if (img.id) {
            await tx.productImage.update({
              where: { id: img.id },
              data: {
                url: img.url,
                altText: img.altText,
                isPrimary: img.isPrimary,
                sortOrder: img.sortOrder,
              },
            });
          } else {
            await tx.productImage.create({
              data: {
                productId: id,
                url: img.url,
                altText: img.altText ?? "",
                isPrimary: img.isPrimary ?? false,
                sortOrder: img.sortOrder ?? 0,
              },
            });
          }
        }
      }

      return updatedProduct;
    });

    // Fetch updated product with relations
    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true, images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(successResponse(fullProduct));
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
