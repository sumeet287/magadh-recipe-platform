import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

// GET — list wishlist items
export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      select: { productId: true },
    });

    return NextResponse.json(successResponse(items.map((i) => i.productId)));
  } catch (err) {
    return handleApiError(err);
  }
}

// POST — toggle wishlist
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ success: false, message: "productId required" }, { status: 400 });

    const existing = await prisma.wishlistItem.findFirst({
      where: { userId: session.user.id, productId },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json(successResponse({ added: false }));
    } else {
      await prisma.wishlistItem.create({ data: { userId: session.user.id, productId } });
      return NextResponse.json(successResponse({ added: true }), { status: 201 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
