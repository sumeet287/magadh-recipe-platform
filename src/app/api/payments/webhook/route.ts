import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const rawBody = await req.text();

  const isValid = verifyRazorpayWebhook(rawBody, signature);
  if (!isValid) {
    logger.warn("Invalid Razorpay webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const { event: eventType, payload } = event;

  try {
    if (eventType === "payment.captured") {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const paymentId = payment.id;

      const dbPayment = await prisma.payment.findFirst({ where: { razorpayOrderId } });
      if (dbPayment && dbPayment.status !== "CAPTURED") {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: dbPayment.id },
            data: { status: "CAPTURED", razorpayPaymentId: paymentId, paidAt: new Date() },
          }),
          prisma.order.update({
            where: { id: dbPayment.orderId },
            data: { status: "CONFIRMED" },
          }),
        ]);
      }
    }

    if (eventType === "payment.failed") {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const dbPayment = await prisma.payment.findFirst({ where: { razorpayOrderId } });
      if (dbPayment) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: dbPayment.id },
            data: { status: "FAILED" },
          }),
          prisma.order.update({
            where: { id: dbPayment.orderId },
            data: { status: "FAILED" },
          }),
        ]);
      }
    }

    if (eventType === "refund.processed") {
      const refund = payload.refund.entity;
      const paymentId = refund.payment_id;

      const dbPayment = await prisma.payment.findFirst({ where: { razorpayPaymentId: paymentId } });
      if (dbPayment) {
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: "REFUNDED",
            refundId: refund.id,
            refundAmount: refund.amount / 100,
            refundedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
