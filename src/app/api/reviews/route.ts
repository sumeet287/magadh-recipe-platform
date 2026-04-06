import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { reviewSchema } from "@/lib/validations/review";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";

// POST /api/reviews — submit a review
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`review:${session.user.id}`, RATE_LIMITS.general)) {
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { productId, rating, title, body: reviewBody, orderId } = parsed.data;

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new ValidationError("Product not found");

    // Optionally verify purchase
    let isVerified = false;
    if (orderId) {
      const orderItem = await prisma.orderItem.findFirst({
        where: { order: { id: orderId, userId: session.user.id, status: "DELIVERED" }, productId },
      });
      isVerified = !!orderItem;
    }

    // Check duplicate
    const existing = await prisma.review.findFirst({
      where: { productId, userId: session.user.id },
    });
    if (existing) throw new ValidationError("You have already reviewed this product");

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        title: title ?? null,
        body: reviewBody,
        status: "PENDING",
        isVerified,
        orderId: orderId ?? null,
      },
    });

    return NextResponse.json(successResponse(review), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
