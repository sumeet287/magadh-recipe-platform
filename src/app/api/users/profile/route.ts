import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { updateProfileSchema } from "@/lib/validations/auth";

// GET /api/users/profile
export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, image: true, role: true, createdAt: true },
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

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name, phone: parsed.data.phone ?? null },
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json(successResponse(user));
  } catch (err) {
    return handleApiError(err);
  }
}
