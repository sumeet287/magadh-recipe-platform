import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { verifyPaymentSchema } from "@/lib/validations/order";
import { sendOrderNotifications } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parsed.data;

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) throw new ValidationError("Payment verification failed");

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: {
        items: true,
        shipping: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!order) throw new NotFoundError("Order not found");

    // Confirm order + capture payment + decrement stock (deferred from order creation for Razorpay)
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
      await tx.payment.update({
        where: { orderId },
        data: { status: "CAPTURED", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, paidAt: new Date() },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "CONFIRMED", comment: "Payment received via Razorpay" },
      });

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    });

    sendOrderNotifications(order, session.user.email ?? undefined).catch(() => {});

    return NextResponse.json(successResponse({ orderId }));
  } catch (err) {
    return handleApiError(err);
  }
}
