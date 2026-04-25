import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { checkoutSessionStartSchema } from "@/lib/validations/checkout-session";

// POST /api/checkout/session/start
// Creates (or refreshes) a CheckoutSession for abandoned-checkout recovery.
// Anonymous + logged-in both supported. Idempotent when `sessionId` is passed.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSessionStartSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const session = await auth();
    const userId = session?.user?.id ?? null;

    const {
      sessionId,
      phone,
      email,
      name,
      items,
      totalAmount,
    } = parsed.data;

    const normalizedPhone = phone && phone.length > 0 ? phone : null;
    const normalizedEmail = email && email.length > 0 ? email.toLowerCase() : null;
    const normalizedName = name && name.length > 0 ? name : null;

    const snapshot = {
      items,
      capturedAt: new Date().toISOString(),
    };

    // If client sent an existing session id, refresh it.
    if (sessionId) {
      const existing = await prisma.checkoutSession.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true },
      });
      if (existing && existing.status === "STARTED") {
        const updated = await prisma.checkoutSession.update({
          where: { id: existing.id },
          data: {
            userId: userId ?? undefined,
            phone: normalizedPhone ?? undefined,
            email: normalizedEmail ?? undefined,
            name: normalizedName ?? undefined,
            cartSnapshot: snapshot,
            totalAmount,
            lastActivityAt: new Date(),
          },
        });
        return NextResponse.json(successResponse({ id: updated.id }));
      }
    }

    const created = await prisma.checkoutSession.create({
      data: {
        userId,
        phone: normalizedPhone,
        email: normalizedEmail,
        name: normalizedName,
        cartSnapshot: snapshot,
        totalAmount,
        status: "STARTED",
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json(successResponse({ id: created.id }), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
