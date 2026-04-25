import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") throw new ForbiddenError();
  return session;
}

// GET /api/admin/broadcasts/:id
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!broadcast) throw new NotFoundError("Broadcast not found");
    return NextResponse.json(successResponse(broadcast));
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/admin/broadcasts/:id (only PENDING can be cancelled)
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const existing = await prisma.broadcast.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundError("Broadcast not found");
    if (existing.status !== "PENDING") {
      throw new ValidationError("Only pending broadcasts can be cancelled");
    }
    await prisma.broadcast.update({
      where: { id },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
    return NextResponse.json(successResponse({ id, status: "CANCELLED" }));
  } catch (err) {
    return handleApiError(err);
  }
}
