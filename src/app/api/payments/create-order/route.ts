import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ success: false, message: "orderId required" }, { status: 400 });

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
    });
    if (!order) throw new NotFoundError("Order not found");

    const razorpayOrder = await createRazorpayOrder(order.totalAmount, order.id);

    // Upsert payment record
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        method: "RAZORPAY",
        amount: order.totalAmount,
        currency: "INR",
        status: "PENDING",
        razorpayOrderId: razorpayOrder.id,
      },
      update: {
        razorpayOrderId: razorpayOrder.id,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      successResponse({
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderNumber: order.orderNumber,
      })
    );
  } catch (err) {
    return handleApiError(err);
  }
}
