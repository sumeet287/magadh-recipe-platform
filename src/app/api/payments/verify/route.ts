import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { verifyPaymentSchema } from "@/lib/validations/order";
import { sendMail, orderConfirmationHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parsed.data;

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) throw new ValidationError("Payment verification failed");

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } }, shipping: true },
    });
    if (!order) throw new NotFoundError("Order not found");

    // Update order + payment in transaction
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      }),
      prisma.payment.update({
        where: { orderId },
        data: {
          status: "CAPTURED",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date(),
        },
      }),      prisma.orderStatusHistory.create({
        data: { orderId, status: "CONFIRMED", comment: "Payment received via Razorpay" },
      }),
    ]);

    // Send confirmation email (non-blocking)
    if (session.user.email) {
      sendMail({
        to: session.user.email,
        subject: `Order Confirmed – #${order.orderNumber}`,
        html: orderConfirmationHtml(order as unknown as Parameters<typeof orderConfirmationHtml>[0]),
      }).catch(() => {}); // fire and forget
    }

    return NextResponse.json(successResponse({ orderId }));
  } catch (err) {
    return handleApiError(err);
  }
}
