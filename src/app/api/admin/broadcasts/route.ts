import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from "@/lib/errors";
import { paginatedResponse, successResponse } from "@/lib/api-response";
import { broadcastCreateSchema } from "@/lib/validations/broadcast";
import {
  normalizeWhatsappNumber,
  isWhatsappTemplatesReady,
  TEMPLATES_NOT_READY_MESSAGE,
} from "@/lib/whatsapp";
import { triggerBroadcastProcessor } from "@/lib/broadcast-trigger";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") throw new ForbiddenError();
  return session;
}

// GET /api/admin/broadcasts
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20")));

    const [rows, total] = await Promise.all([
      prisma.broadcast.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.broadcast.count(),
    ]);

    return paginatedResponse(rows, total, page, limit);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/admin/broadcasts — create a broadcast, enqueue recipients
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();

    // Guard: don't let admins queue broadcasts while templates are still
    // under Meta review — otherwise recipients would pile up with zero
    // sends and no visible reason.
    if (!isWhatsappTemplatesReady()) {
      throw new ValidationError(TEMPLATES_NOT_READY_MESSAGE);
    }

    const body = await req.json();
    const parsed = broadcastCreateSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const { name, templateName, templateLanguage, templateParams, audience } = parsed.data;

    const users = await prisma.user.findMany({
      where: {
        ...(audience.optedInOnly ? { marketingOptIn: true } : {}),
        phone: { not: null },
        ...(audience.includeUnverifiedPhone ? {} : { phoneVerified: true }),
      },
      select: { id: true, phone: true },
      take: audience.limit,
    });

    const recipients = users
      .map((u) => {
        const phone = normalizeWhatsappNumber(u.phone);
        return phone ? { userId: u.id, phone } : null;
      })
      .filter((r): r is { userId: string; phone: string } => r !== null);

    if (recipients.length === 0) {
      throw new ValidationError("No recipients match the selected audience.");
    }

    const broadcast = await prisma.$transaction(async (tx) => {
      const created = await tx.broadcast.create({
        data: {
          name,
          templateName,
          templateLanguage,
          templateParams,
          audienceFilter: audience,
          totalRecipients: recipients.length,
          status: "PENDING",
          createdBy: session.user.id,
        },
      });

      await tx.broadcastRecipient.createMany({
        data: recipients.map((r) => ({
          broadcastId: created.id,
          userId: r.userId,
          phone: r.phone,
          status: "PENDING",
        })),
      });

      return created;
    });

    // Kick off the processor right after this response is flushed so the
    // first batch goes out within seconds. Each processor invocation
    // self-chains for subsequent batches, and the daily cron acts as a
    // safety net if the chain ever breaks.
    after(() => triggerBroadcastProcessor());

    return NextResponse.json(successResponse(broadcast), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
