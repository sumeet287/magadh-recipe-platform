import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, NotFoundError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: {
        category: true,
        variants: { orderBy: { price: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
        reviews: {
          where: { status: "APPROVED" },
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!product) throw new NotFoundError("Product not found");

    return NextResponse.json(successResponse(product));
  } catch (err) {
    return handleApiError(err);
  }
}
