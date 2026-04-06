import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const pincode = req.nextUrl.searchParams.get("pincode");
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      throw new ValidationError("Invalid pincode");
    }

    const zone = await prisma.pincodeZone.findUnique({ where: { pincode } });

    if (!zone || !zone.isActive) {
      return NextResponse.json(successResponse({ isActive: false }));
    }

    return NextResponse.json(
      successResponse({
        isActive: true,
        city: zone.city,
        state: zone.state,
        deliveryDays: zone.deliveryDays,
        zone: zone.zone,
      })
    );
  } catch (err) {
    return handleApiError(err);
  }
}
