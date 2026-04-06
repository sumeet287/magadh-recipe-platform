import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";
import { addressSchema } from "@/lib/validations/address";

async function getOwnedAddress(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new NotFoundError("Address not found");
  return address;
}

// PATCH /api/users/addresses/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    const { id } = await params;
    await getOwnedAddress(session.user.id, id);

    const body = await req.json();
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({ where: { id }, data: parsed.data });
    return NextResponse.json(successResponse(address));
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/users/addresses/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    const { id } = await params;
    await getOwnedAddress(session.user.id, id);

    await prisma.address.delete({ where: { id } });
    return NextResponse.json(successResponse(null));
  } catch (err) {
    return handleApiError(err);
  }
}
