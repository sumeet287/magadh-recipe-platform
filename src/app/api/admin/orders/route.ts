import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { sendMail, orderShippedHtml, orderDeliveredHtml, orderCancelledHtml } from "@/lib/email";

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

      // Restore stock on cancellation
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

    // Send status change email to customer
    const customerName = order.shipping?.recipientName ?? order.user?.name ?? "Customer";
    const customerEmail = order.user?.email;

    if (customerEmail) {
      if (status === "SHIPPED") {
        sendMail({
          to: customerEmail,
          subject: `Your Order #${order.orderNumber} Has Been Shipped!`,
          html: orderShippedHtml({
            orderNumber: order.orderNumber,
            customerName,
            trackingNumber,
            trackingUrl,
            courier,
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

    return NextResponse.json(successResponse({ orderId, status }));
  } catch (err) {
    return handleApiError(err);
  }
}
