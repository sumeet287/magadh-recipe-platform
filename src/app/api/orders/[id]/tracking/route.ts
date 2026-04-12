import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { trackByAWB } from "@/lib/shiprocket";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: { shipping: true },
    });

    if (!order) throw new NotFoundError("Order not found");

    const awb = order.shipping?.awbCode;
    if (!awb) {
      return NextResponse.json(
        successResponse({
          hasTracking: false,
          message: "Tracking not yet available",
        })
      );
    }

    try {
      const tracking = await trackByAWB(awb);
      return NextResponse.json(
        successResponse({
          hasTracking: true,
          awbCode: tracking.awbCode,
          courierName: tracking.courierName,
          currentStatus: tracking.currentStatus,
          etd: tracking.etd,
          deliveredDate: tracking.deliveredDate,
          activities: tracking.activities.slice(0, 20),
        })
      );
    } catch {
      return NextResponse.json(
        successResponse({
          hasTracking: true,
          awbCode: awb,
          courierName: order.shipping?.courier ?? "",
          currentStatus: order.status,
          activities: [],
          message: "Live tracking temporarily unavailable",
        })
      );
    }
  } catch (err) {
    return handleApiError(err);
  }
}
