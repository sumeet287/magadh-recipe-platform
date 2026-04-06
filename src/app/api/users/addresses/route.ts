import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { addressSchema } from "@/lib/validations/address";

// GET /api/users/addresses
export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(successResponse(addresses));
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/users/addresses
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    // If setting as default, unset previous default
    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...parsed.data, userId: session.user.id },
    });

    return NextResponse.json(successResponse(address), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
