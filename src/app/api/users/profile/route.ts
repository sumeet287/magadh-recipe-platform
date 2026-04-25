import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ValidationError, ConflictError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { updateProfileSchema } from "@/lib/validations/auth";

// GET /api/users/profile
export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        marketingOptIn: true,
        phonePromptDismissedAt: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(successResponse(user));
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/users/profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { name, phone, marketingOptIn } = parsed.data;

    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true, marketingOptIn: true },
    });
    if (!current) throw new UnauthorizedError();

    const data: Prisma.UserUpdateInput = {};
    if (name !== undefined) data.name = name;

    if (phone !== undefined) {
      const normalizedPhone = phone === "" ? null : phone;
      if (normalizedPhone && normalizedPhone !== current.phone) {
        const existing = await prisma.user.findFirst({
          where: { phone: normalizedPhone, NOT: { id: session.user.id } },
          select: { id: true },
        });
        if (existing) throw new ConflictError("This mobile number is already in use.");
      }
      data.phone = normalizedPhone;
    }

    if (marketingOptIn !== undefined) {
      data.marketingOptIn = marketingOptIn;
      if (marketingOptIn && !current.marketingOptIn) {
        data.marketingOptInAt = new Date();
      } else if (!marketingOptIn && current.marketingOptIn) {
        data.marketingOptInAt = null;
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        marketingOptIn: true,
      },
    });

    return NextResponse.json(successResponse(user));
  } catch (err) {
    return handleApiError(err);
  }
}
