import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

const SR_STATUS_MAP: Record<string, string> = {
  "6": "SHIPPED",           // Shipped
  "7": "DELIVERED",         // Delivered
  "8": "CANCELLED",         // Cancelled
  "9": "RETURN_REQUESTED",  // RTO Initiated
  "10": "RETURN_REQUESTED", // RTO Delivered
  "17": "OUT_FOR_DELIVERY", // Out For Delivery
  "18": "SHIPPED",          // In Transit
  "19": "SHIPPED",          // Out for Pickup
  "20": "PROCESSING",       // Pickup Scheduled
  "38": "SHIPPED",          // Reached at Destination Hub
  "42": "SHIPPED",          // Picked Up
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const awb = body.awb;
    const srStatus = String(body.current_status_id ?? body.status_id ?? "");
    const srStatusText = body.current_status ?? body.status ?? "";

    if (!awb || !srStatus) {
      return NextResponse.json({ ok: false, error: "Missing awb or status" }, { status: 400 });
    }

    const shipping = await prisma.orderShipping.findFirst({
      where: { awbCode: awb },
      include: { order: { select: { id: true, status: true, orderNumber: true } } },
    });

    if (!shipping) {
      console.log(`[Shiprocket Webhook] No order found for AWB: ${awb}`);
      return NextResponse.json({ ok: true, message: "AWB not found, ignored" });
    }

    const newStatus = SR_STATUS_MAP[srStatus] as OrderStatus | undefined;
    if (!newStatus) {
      console.log(`[Shiprocket Webhook] Unmapped status ${srStatus} (${srStatusText}) for ${shipping.order.orderNumber}`);
      return NextResponse.json({ ok: true, message: "Status not mapped, ignored" });
    }

    if (shipping.order.status === newStatus || shipping.order.status === "DELIVERED") {
      return NextResponse.json({ ok: true, message: "No status change needed" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: shipping.order.id },
        data: { status: newStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: shipping.order.id,
          status: newStatus,
          comment: `Shiprocket: ${srStatusText}`,
        },
      });

      if (newStatus === "DELIVERED") {
        await tx.orderShipping.update({
          where: { id: shipping.id },
          data: { deliveredAt: new Date() },
        });
      }
    });

    console.log(`[Shiprocket Webhook] ${shipping.order.orderNumber}: ${shipping.order.status} → ${newStatus} (${srStatusText})`);

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error("[Shiprocket Webhook] Error:", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
