import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { sendMail, orderShippedHtml, orderDeliveredHtml, orderCancelledHtml } from "@/lib/email";
import {
  createShiprocketOrder,
  generateAWB,
  requestPickup,
  cancelShiprocketOrder,
  type ShiprocketOrderPayload,
} from "@/lib/shiprocket";

import { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") throw new ForbiddenError();
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "RETURN_REQUESTED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "REFUND_INITIATED"],
  RETURNED: ["REFUND_INITIATED"],
  REFUND_INITIATED: ["REFUNDED"],
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: { take: 2, include: { product: { select: { name: true } } } },
          shipping: { select: { city: true, state: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: orders, meta: { total, page, limit } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const { orderId, status, note, trackingNumber, trackingUrl, courier } = await req.json();
    if (!orderId || !status) throw new ValidationError("orderId and status are required");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } }, shipping: true },
    });
    if (!order) throw new NotFoundError("Order not found");

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ValidationError(`Cannot transition from ${order.status} to ${status}`);
    }

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipping: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status } });
      await tx.orderStatusHistory.create({
        data: { orderId, status, comment: note ?? null, createdBy: session!.user.id },
      });
      if (trackingNumber || trackingUrl || courier) {
        await tx.orderShipping.update({
          where: { orderId },
          data: {
            trackingNumber: trackingNumber ?? undefined,
            trackingUrl: trackingUrl ?? undefined,
            courier: courier ?? undefined,
          },
        });
      }
      if (status === "DELIVERED") {
        await tx.orderShipping.update({ where: { orderId }, data: { deliveredAt: new Date() } });
      }

      if (status === "CANCELLED") {
        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });

    // Shiprocket: create order on PROCESSING, cancel on CANCELLED
    let srTrackingNumber: string | undefined;
    let srTrackingUrl: string | undefined;
    let srCourier: string | undefined;

    if (status === "PROCESSING" && fullOrder?.shipping && !fullOrder.shipping.shiprocketOrderId) {
      try {
        const shipping = fullOrder.shipping;
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
          billing_email: order.user?.email ?? "",
          billing_phone: shipping.phone.replace(/\D/g, "").slice(-10),
          shipping_is_billing: true,
          order_items: fullOrder.items.map((item) => ({
            name: item.productName,
            sku: item.sku,
            units: item.quantity,
            selling_price: item.unitPrice,
          })),
          payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
          sub_total: order.subtotalAmount,
          length: 20,
          breadth: 15,
          height: 10,
          weight: 0.5,
        };

        const srOrder = await createShiprocketOrder(payload);

        if (srOrder.shipment_id) {
          const awbData = await generateAWB(srOrder.shipment_id);
          await requestPickup(srOrder.shipment_id).catch(() => {});

          srTrackingNumber = awbData.awb_code;
          srCourier = awbData.courier_name;
          srTrackingUrl = `https://www.shiprocket.in/shipment-tracking/${awbData.awb_code}`;

          await prisma.orderShipping.update({
            where: { orderId },
            data: {
              shiprocketOrderId: srOrder.order_id,
              shiprocketShipmentId: srOrder.shipment_id,
              awbCode: awbData.awb_code,
              trackingNumber: awbData.awb_code,
              trackingUrl: `https://www.shiprocket.in/shipment-tracking/${awbData.awb_code}`,
              courier: awbData.courier_name,
            },
          });
        }

        console.log(`[Shiprocket] Order ${order.orderNumber} → SR#${srOrder.order_id}, AWB: ${srTrackingNumber}`);
      } catch (err) {
        console.error("[Shiprocket] Failed to create order:", err);
      }
    }

    if (status === "CANCELLED" && fullOrder?.shipping?.shiprocketOrderId) {
      try {
        await cancelShiprocketOrder([fullOrder.shipping.shiprocketOrderId]);
        console.log(`[Shiprocket] Cancelled SR order for ${order.orderNumber}`);
      } catch (err) {
        console.error("[Shiprocket] Failed to cancel order:", err);
      }
    }

    // Send status change email to customer
    const customerName = order.shipping?.recipientName ?? order.user?.name ?? "Customer";
    const customerEmail = order.user?.email;
    const finalTrackingNumber = srTrackingNumber ?? trackingNumber;
    const finalTrackingUrl = srTrackingUrl ?? trackingUrl;
    const finalCourier = srCourier ?? courier;

    if (customerEmail) {
      if (status === "SHIPPED" || (status === "PROCESSING" && finalTrackingNumber)) {
        sendMail({
          to: customerEmail,
          subject: `Your Order #${order.orderNumber} Has Been Shipped!`,
          html: orderShippedHtml({
            orderNumber: order.orderNumber,
            customerName,
            trackingNumber: finalTrackingNumber,
            trackingUrl: finalTrackingUrl,
            courier: finalCourier,
          }),
        }).catch(() => {});
      } else if (status === "DELIVERED") {
        sendMail({
          to: customerEmail,
          subject: `Your Order #${order.orderNumber} Has Been Delivered!`,
          html: orderDeliveredHtml({ orderNumber: order.orderNumber, customerName }),
        }).catch(() => {});
      } else if (status === "CANCELLED") {
        sendMail({
          to: customerEmail,
          subject: `Order #${order.orderNumber} Cancelled`,
          html: orderCancelledHtml({ orderNumber: order.orderNumber, customerName, reason: note }),
        }).catch(() => {});
      }
    }

    return NextResponse.json(successResponse({ orderId, status, shiprocket: !!srTrackingNumber }));
  } catch (err) {
    return handleApiError(err);
  }
}
