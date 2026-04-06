import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { checkoutSchema } from "@/lib/validations/order";
import { generateOrderNumber } from "@/lib/utils";
import { GST_RATE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "@/lib/constants";

// POST /api/orders — create order
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { items, address, couponCode, paymentMethod } = parsed.data;

    if (!address) throw new ValidationError("Delivery address is required");

    // Validate all items and variants, lock stock
    const variantIds = items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { name: true } } },
    });

    if (variants.length !== items.length) throw new ValidationError("One or more products are unavailable");

    // Check stock
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) throw new ValidationError(`Product variant not found`);
      if (variant.stock < item.quantity) {
        throw new ValidationError(`Insufficient stock for "${variant.product.name}"`);
      }
    }

    // Validate coupon if provided
    let coupon = null;
    let couponDiscount = 0;
    if (couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      });
      if (!coupon) throw new ValidationError("Invalid or expired coupon");
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new ValidationError("Coupon usage limit reached");
      }
    }

    // Calculate amounts
    let subtotal = 0;
    let totalMrp = 0;
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      subtotal += variant.price * item.quantity;
      totalMrp += variant.mrp * item.quantity;
    }
    const productDiscount = totalMrp - subtotal;

    if (coupon) {
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        throw new ValidationError(`Minimum order of ₹${coupon.minOrderAmount} required for this coupon`);
      }
      if (coupon.type === "PERCENTAGE") {
        couponDiscount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscountAmount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
      } else if (coupon.type === "FIXED") {
        couponDiscount = Math.min(coupon.value, subtotal);
      }
    }

    const isFreeShipping = coupon?.type === "FREE_SHIPPING" || subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingCharge = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const codFee = paymentMethod === "COD" ? 30 : 0;
    const taxableAmount = subtotal - couponDiscount;
    const taxAmount = Math.round((taxableAmount * GST_RATE) / (100 + GST_RATE) * 100) / 100;
    const totalAmount = taxableAmount + shippingCharge + codFee;

    const orderNumber = generateOrderNumber();

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
          subtotalAmount: subtotal,
          discountAmount: productDiscount + couponDiscount,
          shippingAmount: shippingCharge,
          taxAmount,
          totalAmount,
          couponCode: coupon?.code,
          couponDiscount,
          paymentMethod: paymentMethod as "RAZORPAY" | "COD" | "UPI",
          items: {
            create: items.map((item) => {
              const variant = variants.find((v) => v.id === item.variantId)!;
              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: variant.product.name,
                variantName: variant.name,
                sku: variant.sku,
                quantity: item.quantity,
                unitPrice: variant.price,
                totalPrice: variant.price * item.quantity,
                imageUrl: null,
              };
            }),
          },
          shipping: {
            create: {
              recipientName: address.name,
              phone: address.phone,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2 ?? null,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              country: "India",
            },
          },
        },
      });

      // Decrement stock
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Increment coupon usage
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponUsage.create({
          data: { couponId: coupon.id, userId: session.user.id, orderId: newOrder.id },
        });
      }

      return newOrder;
    });

    return NextResponse.json(successResponse(order), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

// GET /api/orders — get user orders
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.user.id },
        include: { items: { include: { product: { select: { name: true } } }, take: 2 } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ success: true, data: orders, meta: { total, page, limit } });
  } catch (err) {
    return handleApiError(err);
  }
}
