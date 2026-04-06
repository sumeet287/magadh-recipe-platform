import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

// PUT /api/cart/[itemId] — update quantity
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    const { itemId } = await params;
    const { quantity } = await req.json();

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: session.user.id } },
      include: { variant: { select: { stock: true } } },
    });
    if (!item) throw new NotFoundError("Cart item not found");

    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const newQty = Math.min(quantity, 10, item.variant.stock);
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: newQty } });
    }

    return NextResponse.json(successResponse(null));
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/cart/[itemId] — remove item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    const { itemId } = await params;

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: session.user.id } },
    });
    if (!item) throw new NotFoundError("Cart item not found");

    await prisma.cartItem.delete({ where: { id: itemId } });

    return NextResponse.json(successResponse(null));
  } catch (err) {
    return handleApiError(err);
  }
}
