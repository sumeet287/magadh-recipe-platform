import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { newsletterSchema } from "@/lib/validations/review";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimiter.check(`newsletter:${ip}`, RATE_LIMITS.newsletter)) {
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const existing = await prisma.newsletter.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletter.update({ where: { id: existing.id }, data: { isActive: true } });
      }
      return NextResponse.json(successResponse({ alreadySubscribed: existing.isActive }));
    }

    await prisma.newsletter.create({ data: { email: parsed.data.email } });
    return NextResponse.json(successResponse(null), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
