import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { verifyPaymentSchema } from "@/lib/validations/order";
import { sendOrderNotifications } from "@/lib/email";
import { finalizeRazorpayCapture } from "@/lib/razorpay-capture";

/**
 * Confirms payment after Razorpay checkout. Does NOT require a logged-in session: the
 * HMAC signature + order/payment row match is sufficient (session can drop during redirect).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parsed.data;

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      throw new ValidationError("Payment verification failed");
    }

    const pay = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      select: { orderId: true },
    });
    if (!pay) throw new NotFoundError("Payment");
    if (pay.orderId !== orderId) {
      throw new ValidationError("Order does not match this payment session");
    }

    const result = await finalizeRazorpayCapture({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      clientOrderId: orderId,
    });

    if (result.didTransition) {
      const customerEmail = result.notifyOrderPayload.user?.email ?? undefined;
      after(async () => {
        try {
          await sendOrderNotifications(result.notifyOrderPayload, customerEmail);
        } catch (e) {
          console.error("[Email] sendOrderNotifications failed:", e);
        }
      });
    }

    return NextResponse.json(successResponse({ orderId: result.orderId }));
  } catch (err) {
    return handleApiError(err);
  }
}
