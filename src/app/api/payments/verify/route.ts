import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { verifyPaymentSchema } from "@/lib/validations/order";
import { sendOrderNotifications } from "@/lib/email";
import {
  createShiprocketOrder,
  type ShiprocketOrderPayload,
} from "@/lib/shiprocket";

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

    // Auto-create Shiprocket order for prepaid orders
    if (order.shipping && !order.shipping.shiprocketOrderId) {
      try {
        const shipping = order.shipping;
        const orderDate = new Date(order.createdAt)
          .toISOString()
          .replace("T", " ")
          .slice(0, 16);

        const payload: ShiprocketOrderPayload = {
          order_id: order.orderNumber,
          order_date: orderDate,
          pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Patna Br",
          billing_customer_name: shipping.recipientName.split(" ")[0],
          billing_last_name: shipping.recipientName.split(" ").slice(1).join(" ") || undefined,
          billing_address: shipping.addressLine1,
          billing_address_2: shipping.addressLine2 ?? undefined,
          billing_city: shipping.city,
          billing_pincode: shipping.pincode,
          billing_state: shipping.state,
          billing_country: shipping.country || "India",
          billing_email: session.user.email ?? "",
          billing_phone: shipping.phone.replace(/\D/g, "").slice(-10),
          shipping_is_billing: true,
          order_items: order.items.map((item) => ({
            name: item.productName,
            sku: item.sku,
            units: item.quantity,
            selling_price: item.unitPrice,
          })),
          payment_method: "Prepaid",
          sub_total: order.subtotalAmount,
          length: 20,
          breadth: 15,
          height: 10,
          weight: 0.5,
        };

        const srOrder = await createShiprocketOrder(payload);

        await prisma.orderShipping.update({
          where: { orderId },
          data: {
            shiprocketOrderId: srOrder.order_id,
            shiprocketShipmentId: srOrder.shipment_id ?? null,
          },
        });

        console.log(`[Shiprocket] Order created: ${order.orderNumber} → SR#${srOrder.order_id} (courier selection pending by admin)`);
      } catch (err) {
        console.error("[Shiprocket] Auto-create failed for", order.orderNumber, err);
      }
    }

    // Send confirmation emails + WhatsApp after the response is sent.
    // Using `after()` ensures the serverless function stays alive until the
    // notifications finish, unlike plain fire-and-forget which gets killed
    // the moment the response returns on Vercel.
    const customerEmailForNotif = session.user.email ?? undefined;
    after(async () => {
      try {
        await sendOrderNotifications(order, customerEmailForNotif);
      } catch (e) {
        console.error("[Email] sendOrderNotifications failed:", e);
      }
    });

    return NextResponse.json(successResponse({ orderId }));
  } catch (err) {
    return handleApiError(err);
  }
}
