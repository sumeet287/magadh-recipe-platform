import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { logger } from "@/lib/logger";
import { sendOrderNotifications } from "@/lib/email";
import { finalizeRazorpayCapture } from "@/lib/razorpay-capture";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    logger.error("RAZORPAY_WEBHOOK_SECRET is missing — Razorpay webhooks cannot be verified.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();

  if (!verifyRazorpayWebhook(rawBody, signature)) {
    logger.warn("Invalid Razorpay webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: Record<string, { entity?: Record<string, unknown> }> };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event;
  try {
    if (eventType === "payment.captured") {
      const payment = event.payload?.payment?.entity as
        | { id?: string; order_id?: string }
        | undefined;
      const razorpayOrderId =
        typeof payment?.order_id === "string" ? payment.order_id : undefined;
      const razorpayPaymentId = typeof payment?.id === "string" ? payment.id : undefined;

      if (!razorpayOrderId || !razorpayPaymentId) {
        logger.warn(`Razorpay webhook ${eventType} missing order_id or payment id`);
        return NextResponse.json({ received: true, skipped: true });
      }

      const result = await finalizeRazorpayCapture({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: null,
      });

      if (result.didTransition) {
        const customerEmail = result.notifyOrderPayload.user?.email ?? undefined;
        after(async () => {
          try {
            await sendOrderNotifications(result.notifyOrderPayload, customerEmail);
          } catch (e) {
            logger.error("Webhook notify failed:", e);
          }
        });
      }

      await prisma.payment.updateMany({
        where: { razorpayOrderId },
        data: {
          webhookVerified: true,
          webhookPayload: event as Prisma.InputJsonValue,
        },
      }).catch(() => {});

      return NextResponse.json({ received: true });
    }

    if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity as { order_id?: string } | undefined;
      const razorpayOrderId =
        typeof payment?.order_id === "string" ? payment.order_id : undefined;

      if (razorpayOrderId) {
        const dbPayment = await prisma.payment.findFirst({ where: { razorpayOrderId } });
        if (
          dbPayment &&
          !["CAPTURED", "FAILED", "REFUNDED"].includes(dbPayment.status)
        ) {
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

      return NextResponse.json({ received: true });
    }

    if (eventType === "refund.processed") {
      const refund = event.payload?.refund?.entity as { payment_id?: string; id?: string } | undefined;
      const paymentId =
        typeof refund?.payment_id === "string" ? refund.payment_id : undefined;

      if (!paymentId) return NextResponse.json({ received: true });

      const dbPayment = await prisma.payment.findFirst({ where: { razorpayPaymentId: paymentId } });
      if (dbPayment) {
        const refundAmount =
          typeof (refund as { amount?: number }).amount === "number"
            ? ((refund as { amount: number }).amount ?? 0) / 100
            : undefined;
        await prisma.payment.update({
          where: { id: dbPayment.id },
          data: {
            status: "REFUNDED",
            refundId: refund?.id ?? undefined,
            refundAmount,
            refundedAt: new Date(),
          },
        });
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: eventType });
  } catch (err) {
    logger.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
