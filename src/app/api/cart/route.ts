import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

// GET /api/cart — get current user's cart
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
            variant: { select: { name: true, price: true, mrp: true, stock: true, sku: true } },
          },
        },
      },
    });

    return NextResponse.json(successResponse(cart));
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/cart — add item to cart
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const { productId, variantId, quantity } = await req.json();

    // Validate inputs
    if (!productId || !variantId || !quantity || quantity < 1) {
      return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.stock < quantity) {
      return NextResponse.json({ success: false, message: "Insufficient stock" }, { status: 400 });
    }

    let cart = await prisma.cart.findFirst({ where: { userId: session.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: session.user.id } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId },
    });

    if (existingItem) {
      const newQty = Math.min(existingItem.quantity + quantity, 10);
      await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity } });
    }

    return NextResponse.json(successResponse(null), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/cart — clear cart
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const cart = await prisma.cart.findFirst({ where: { userId: session.user.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return NextResponse.json(successResponse(null));
  } catch (err) {
    return handleApiError(err);
  }
}
