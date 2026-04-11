import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session) throw new UnauthorizedError();
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
    throw new ForbiddenError();
}

export async function GET() {
  try {
    const session = await auth();
    requireAdmin(session);

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(coupons));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const body = await req.json();
    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      perUserLimit,
      startDate,
      endDate,
      isActive,
    } = body;

    if (!code || !type || value === undefined)
      throw new ValidationError("code, type, and value are required");

    if (!["PERCENTAGE", "FIXED", "FREE_SHIPPING"].includes(type))
      throw new ValidationError("Invalid coupon type");

    if (type === "PERCENTAGE" && (value < 0 || value > 100))
      throw new ValidationError("Percentage value must be between 0 and 100");

    if (type === "FIXED" && value < 0)
      throw new ValidationError("Fixed value must be positive");

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || null,
        type,
        value,
        minOrderAmount: minOrderAmount ?? null,
        maxDiscountAmount: maxDiscountAmount ?? null,
        usageLimit: usageLimit ?? null,
        perUserLimit: perUserLimit ?? 1,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(successResponse(coupon), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) throw new ValidationError("Coupon id is required");

    if (fields.type && !["PERCENTAGE", "FIXED", "FREE_SHIPPING"].includes(fields.type))
      throw new ValidationError("Invalid coupon type");

    if (fields.type === "PERCENTAGE" && fields.value !== undefined && (fields.value < 0 || fields.value > 100))
      throw new ValidationError("Percentage value must be between 0 and 100");

    const data: Record<string, unknown> = {};
    if (fields.code !== undefined) data.code = fields.code.toUpperCase().trim();
    if (fields.description !== undefined) data.description = fields.description || null;
    if (fields.type !== undefined) data.type = fields.type;
    if (fields.value !== undefined) data.value = fields.value;
    if (fields.minOrderAmount !== undefined) data.minOrderAmount = fields.minOrderAmount ?? null;
    if (fields.maxDiscountAmount !== undefined) data.maxDiscountAmount = fields.maxDiscountAmount ?? null;
    if (fields.usageLimit !== undefined) data.usageLimit = fields.usageLimit ?? null;
    if (fields.perUserLimit !== undefined) data.perUserLimit = fields.perUserLimit;
    if (fields.startDate !== undefined) data.startDate = fields.startDate ? new Date(fields.startDate) : null;
    if (fields.endDate !== undefined) data.endDate = fields.endDate ? new Date(fields.endDate) : null;
    if (fields.isActive !== undefined) data.isActive = fields.isActive;

    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json(successResponse(coupon));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    requireAdmin(session);

    const { id } = await req.json();
    if (!id) throw new ValidationError("Coupon id is required");

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new ValidationError("Coupon not found");

    if (coupon.usedCount > 0) {
      const updated = await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json(
        successResponse(updated, "Coupon has been used and was deactivated instead of deleted")
      );
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json(successResponse({ id }));
  } catch (err) {
    return handleApiError(err);
  }
}
