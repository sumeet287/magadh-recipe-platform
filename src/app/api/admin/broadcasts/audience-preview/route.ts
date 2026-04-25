import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

// GET /api/admin/broadcasts/audience-preview
// Returns the count of users that would receive a broadcast with the given filters.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") throw new ForbiddenError();

    const sp = req.nextUrl.searchParams;
    const optedInOnly = sp.get("optedInOnly") !== "false";
    const includeUnverifiedPhone = sp.get("includeUnverifiedPhone") === "true";

    const count = await prisma.user.count({
      where: {
        ...(optedInOnly ? { marketingOptIn: true } : {}),
        phone: { not: null },
        ...(includeUnverifiedPhone ? {} : { phoneVerified: true }),
      },
    });

    return NextResponse.json(successResponse({ count }));
  } catch (err) {
    return handleApiError(err);
  }
}
