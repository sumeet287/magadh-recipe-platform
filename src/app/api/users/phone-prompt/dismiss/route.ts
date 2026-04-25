import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

// POST /api/users/phone-prompt/dismiss
// Marks the phone-capture popup as dismissed for 7 days.
export async function POST() {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();

    const now = new Date();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phonePromptDismissedAt: now },
    });

    return NextResponse.json(successResponse({ dismissedAt: now.toISOString() }));
  } catch (err) {
    return handleApiError(err);
  }
}
