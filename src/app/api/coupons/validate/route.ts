import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { couponValidateSchema } from "@/lib/validations/order";
import { auth } from "@/lib/auth";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`coupon:${ip}`, RATE_LIMITS.general)) {
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
    }

    const session = await auth();
    const body = await req.json();
    const parsed = couponValidateSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { code, subtotal } = parsed.data;

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    if (!coupon) throw new ValidationError("Invalid or expired coupon code");

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ValidationError("This coupon has reached its usage limit");
    }

    // Check per-user usage
    if (session && coupon.perUserLimit) {
      const userUsage = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: session.user.id },
      });
      if (userUsage >= coupon.perUserLimit) {
        throw new ValidationError("You have already used this coupon");
      }
    }

    // Check minimum order
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      throw new ValidationError(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    } else if (coupon.type === "FIXED") {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    return NextResponse.json(
      successResponse({
        code: coupon.code,
        type: coupon.type,
        discountValue: coupon.value,
        maxDiscountAmount: coupon.maxDiscountAmount,
        discountAmount,
        description: coupon.description,
      })
    );
  } catch (err) {
    return handleApiError(err);
  }
}
