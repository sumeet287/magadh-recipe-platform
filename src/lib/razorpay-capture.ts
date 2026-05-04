import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createShiprocketOrder, type ShiprocketOrderPayload } from "@/lib/shiprocket";

const NOTIFY_ORDER_INCLUDE = {
  items: true,
  shipping: true,
  user: { select: { name: true, email: true } },
} satisfies Prisma.OrderInclude;

export type OrderNotifyPayload = Prisma.OrderGetPayload<{
  include: typeof NOTIFY_ORDER_INCLUDE;
}>;

/**
 * Marks Razorpay payment captured + confirms order once (atomic). Safe if verify + webhook
 * both fire, or client retries verification after session loss — only one wins stock decrement.
 */
export async function finalizeRazorpayCapture(params: {
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  clientOrderId?: string | null;
}): Promise<{
  didTransition: boolean;
  orderId: string;
  notifyOrderPayload: OrderNotifyPayload;
}> {
  const paymentRow = await prisma.payment.findUnique({
    where: { razorpayOrderId: params.razorpayOrderId },
    include: {
      order: {
        include: { items: true },
      },
    },
  });

  if (!paymentRow) {
    throw new NotFoundError("Payment");
  }

  if (params.clientOrderId && paymentRow.orderId !== params.clientOrderId) {
    throw new ValidationError("Order does not match this payment session");
  }

  const paymentCaptured =
    paymentRow.status === "CAPTURED" || paymentRow.status === "PAID";

  /** Happy path — already synced */
  if (paymentCaptured && paymentRow.order.status === "CONFIRMED") {
    const refreshed = await prisma.order.findUnique({
      where: { id: paymentRow.orderId },
      include: NOTIFY_ORDER_INCLUDE,
    });
    if (!refreshed) throw new NotFoundError("Order");
    return {
      didTransition: false,
      orderId: paymentRow.orderId,
      notifyOrderPayload: refreshed,
    };
  }

  /**
   * Razorpay shows captured while our webhook only bumped payment earlier — repair order +
   * stock exactly once.
   */
  if (paymentCaptured && paymentRow.order.status === "PENDING") {
    const repaired = await prisma.$transaction(async (tx) => {
      const orderBump = await tx.order.updateMany({
        where: { id: paymentRow.orderId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
      if (orderBump.count === 0) return false;

      await tx.orderStatusHistory.create({
        data: {
          orderId: paymentRow.orderId,
          status: "CONFIRMED",
          comment: "Reconciled — payment already captured at Razorpay",
        },
      });

      for (const item of paymentRow.order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return true;
    });

    if (repaired) {
      await tryCreateShiprocket(paymentRow.orderId);
    }

    const notifyOrderPayload = await prisma.order.findUnique({
      where: { id: paymentRow.orderId },
      include: NOTIFY_ORDER_INCLUDE,
    });
    if (!notifyOrderPayload) throw new NotFoundError("Order");

    return {
      didTransition: repaired,
      orderId: paymentRow.orderId,
      notifyOrderPayload,
    };
  }

  /** Payment not captured locally but order progressed — inconsistent; return snapshot */
  if (!paymentCaptured && paymentRow.order.status !== "PENDING") {
    const refreshed = await prisma.order.findUnique({
      where: { id: paymentRow.orderId },
      include: NOTIFY_ORDER_INCLUDE,
    });
    if (!refreshed) throw new NotFoundError("Order");
    return {
      didTransition: false,
      orderId: paymentRow.orderId,
      notifyOrderPayload: refreshed,
    };
  }

  const transitioned = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: {
        id: paymentRow.id,
        status: { in: ["PENDING", "AUTHORIZED"] },
      },
      data: {
        status: "CAPTURED",
        razorpayPaymentId: params.razorpayPaymentId ?? undefined,
        razorpaySignature: params.razorpaySignature ?? undefined,
        paidAt: new Date(),
      },
    });

    if (updated.count === 0) {
      const pNow = await tx.payment.findUnique({
        where: { id: paymentRow.id },
        select: { status: true },
      });
      const oNow = await tx.order.findUnique({
        where: { id: paymentRow.orderId },
        select: { status: true },
      });
      if (pNow?.status === "CAPTURED" && oNow?.status === "CONFIRMED") return false;
      if (
        (pNow?.status === "CAPTURED" || pNow?.status === "PAID") &&
        oNow?.status === "PENDING"
      ) {
        const orderBump = await tx.order.updateMany({
          where: { id: paymentRow.orderId, status: "PENDING" },
          data: { status: "CONFIRMED" },
        });
        if (orderBump.count === 0) return false;
        await tx.orderStatusHistory.create({
          data: {
            orderId: paymentRow.orderId,
            status: "CONFIRMED",
            comment: "Payment captured — Razorpay (reconciled in same transaction)",
          },
        });
        for (const item of paymentRow.order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        return true;
      }

      throw new ValidationError("Could not confirm payment. Please retry.");
    }

    await tx.order.update({
      where: { id: paymentRow.orderId },
      data: { status: "CONFIRMED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: paymentRow.orderId,
        status: "CONFIRMED",
        comment: "Payment captured — Razorpay",
      },
    });

    for (const item of paymentRow.order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return true;
  });

  if (transitioned) {
    await tryCreateShiprocket(paymentRow.orderId);
  }

  const notifyOrderPayload = await prisma.order.findUnique({
    where: { id: paymentRow.orderId },
    include: NOTIFY_ORDER_INCLUDE,
  });
  if (!notifyOrderPayload) throw new NotFoundError("Order");

  return {
    didTransition: transitioned,
    orderId: paymentRow.orderId,
    notifyOrderPayload,
  };
}

async function tryCreateShiprocket(orderId: string) {
  const orderAfter = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      shipping: true,
      user: { select: { email: true } },
    },
  });
  if (!orderAfter?.shipping || orderAfter.shipping.shiprocketOrderId) return;

  try {
    const shipping = orderAfter.shipping;
    const orderDate = new Date(orderAfter.createdAt).toISOString().replace("T", " ").slice(0, 16);
    const payload: ShiprocketOrderPayload = {
      order_id: orderAfter.orderNumber,
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
      billing_email: orderAfter.user?.email ?? "",
      billing_phone: shipping.phone.replace(/\D/g, "").slice(-10),
      shipping_is_billing: true,
      order_items: orderAfter.items.map((item) => ({
        name: item.productName,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.unitPrice,
      })),
      payment_method: "Prepaid",
      sub_total: orderAfter.subtotalAmount,
      length: 20,
      breadth: 15,
      height: 10,
      weight: 0.5,
    };

    const srOrder = await createShiprocketOrder(payload);

    await prisma.orderShipping.update({
      where: { orderId: orderAfter.id },
      data: {
        shiprocketOrderId: srOrder.order_id,
        shiprocketShipmentId: srOrder.shipment_id ?? null,
      },
    });

    console.log(
      `[Shiprocket] Order created: ${orderAfter.orderNumber} → SR#${srOrder.order_id} (finalizeRazorpayCapture)`
    );
  } catch (err) {
    console.error("[Shiprocket] Auto-create failed for order", orderId, err);
  }
}
