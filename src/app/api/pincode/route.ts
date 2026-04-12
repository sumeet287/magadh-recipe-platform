import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { checkServiceability } from "@/lib/shiprocket";

const pincodeCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const pincode = req.nextUrl.searchParams.get("pincode");
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      throw new ValidationError("Invalid pincode");
    }

    const cached = pincodeCache.get(pincode);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(successResponse(cached.data));
    }

    const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE ?? "800014";

    try {
      const result = await checkServiceability(pickupPincode, pincode);

      if (result.available) {
        const responseData = {
          isActive: true,
          city: "",
          state: "",
          deliveryDays: result.estimatedDays ?? 5,
          zone: "shiprocket",
          couriers: result.couriers.slice(0, 3).map((c) => ({
            name: c.courier_name,
            etd: c.etd,
            rate: c.rate,
          })),
        };

        pincodeCache.set(pincode, { data: responseData, ts: Date.now() });
        return NextResponse.json(successResponse(responseData));
      }
    } catch (err) {
      console.error("[Pincode] Shiprocket serviceability check failed, falling back to DB:", err);
    }

    // Fallback: local DB lookup
    const zone = await prisma.pincodeZone.findUnique({ where: { pincode } });

    if (!zone || !zone.isActive) {
      const notAvailable = { isActive: false };
      pincodeCache.set(pincode, { data: notAvailable, ts: Date.now() });
      return NextResponse.json(successResponse(notAvailable));
    }

    const dbData = {
      isActive: true,
      city: zone.city,
      state: zone.state,
      deliveryDays: zone.deliveryDays,
      zone: zone.zone,
    };

    pincodeCache.set(pincode, { data: dbData, ts: Date.now() });
    return NextResponse.json(successResponse(dbData));
  } catch (err) {
    return handleApiError(err);
  }
}
