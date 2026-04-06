import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
            variant: { select: { name: true } },
          },
        },
        shipping: true,
        payment: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) throw new NotFoundError("Order not found");

    return NextResponse.json(successResponse(order));
  } catch (err) {
    return handleApiError(err);
  }
}
