import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { checkoutSessionHeartbeatSchema } from "@/lib/validations/checkout-session";

// PATCH /api/checkout/session/heartbeat
// Low-cost update from the checkout page. Debounced client-side. Only moves
// `lastActivityAt` + optional contact fields on STARTED sessions.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSessionHeartbeatSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { sessionId, phone, email, name } = parsed.data;

    const existing = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });
    if (!existing || existing.status !== "STARTED") {
      return NextResponse.json(successResponse({ id: sessionId, skipped: true }));
    }

    const normalizedPhone = phone && phone.length > 0 ? phone : undefined;
    const normalizedEmail = email && email.length > 0 ? email.toLowerCase() : undefined;
    const normalizedName = name && name.length > 0 ? name : undefined;

    await prisma.checkoutSession.update({
      where: { id: sessionId },
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        name: normalizedName,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json(successResponse({ id: sessionId }));
  } catch (err) {
    return handleApiError(err);
  }
}
