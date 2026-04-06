import Razorpay from "razorpay";
import crypto from "crypto";

// Lazy initialize — avoids build-time crash when env vars are absent
function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function createRazorpayOrder(
  amount: number, // in INR (we convert to paise)
  orderId: string,
  receipt?: string
) {
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: "INR",
    receipt: receipt ?? orderId,
    notes: {
      orderId,
      source: "magadh-recipe",
    },
  };

  return getRazorpayInstance().orders.create(options);
}

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );
}

export function verifyRazorpayWebhook(
  body: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );
}
