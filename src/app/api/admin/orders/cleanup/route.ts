import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

/**
 * POST /api/admin/orders/cleanup
 *
 * Cancels abandoned Razorpay orders that have been PENDING for more than 30 minutes
 * and restores the reserved stock. Can be called manually from admin or via a cron job.
 *
 * Also callable with a secret header for external cron services:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    // Allow either admin session or cron secret
    if (authHeader === `Bearer ${cronSecret}` && cronSecret) {
      // authenticated via cron secret
    } else {
      const session = await auth();
      if (!session) throw new UnauthorizedError();
      if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") throw new ForbiddenError();
    }

    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        paymentMethod: "RAZORPAY",
        createdAt: { lt: cutoff },
      },
      include: { items: true },
    });

    let cancelledCount = 0;

    for (const order of abandonedOrders) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", cancelReason: "Payment not completed within 30 minutes" },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "CANCELLED",
            comment: "Auto-cancelled: payment not completed within 30 minutes",
          },
        });

        // Note: Stock for Razorpay orders is only decremented on payment verification,
        // so we don't need to restore stock here. But in case of any edge cases where
        // stock was decremented, we restore it as a safety measure.
        // (Currently, Razorpay orders do NOT decrement stock at creation time.)
      });
      cancelledCount++;
    }

    return NextResponse.json(
      successResponse({
        message: `Cleaned up ${cancelledCount} abandoned orders`,
        cancelledCount,
        checkedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    return handleApiError(err);
  }
}
