import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

/**
 * Vercel Cron: /api/cron/broadcasts/process
 *
 * Picks the oldest PENDING or SENDING broadcast and sends a batch of pending
 * recipients each tick. Idempotent — multiple runs just progress one batch at
 * a time. Heavy jobs complete across many cron invocations.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = Number(process.env.BROADCAST_BATCH_SIZE ?? 40);
const INTER_MESSAGE_DELAY_MS = Number(process.env.BROADCAST_THROTTLE_MS ?? 150);

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  const queryToken = req.nextUrl.searchParams.get("token");
  return Boolean(queryToken) && queryToken === secret;
}

function templatesEnabled(): boolean {
  const v = (process.env.WHATSAPP_TEMPLATES_READY ?? "").toLowerCase().trim();
  return v === "true" || v === "1" || v === "yes";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!templatesEnabled()) {
    return NextResponse.json({
      ok: true,
      paused: true,
      reason:
        "WhatsApp templates are not approved yet. Set WHATSAPP_TEMPLATES_READY=true to enable sending.",
    });
  }

  const broadcast = await prisma.broadcast.findFirst({
    where: { status: { in: ["PENDING", "SENDING"] } },
    orderBy: { createdAt: "asc" },
  });

  if (!broadcast) {
    return NextResponse.json({ ok: true, idle: true });
  }

  if (broadcast.status === "PENDING") {
    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { status: "SENDING", startedAt: new Date() },
    });
  }

  const pending = await prisma.broadcastRecipient.findMany({
    where: { broadcastId: broadcast.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  if (pending.length === 0) {
    const counts = await prisma.broadcastRecipient.groupBy({
      by: ["status"],
      where: { broadcastId: broadcast.id },
      _count: { _all: true },
    });
    const sent = counts.find((c) => c.status === "SENT")?._count._all ?? 0;
    const failed = counts.find((c) => c.status === "FAILED")?._count._all ?? 0;
    const total = sent + failed;
    const finalStatus =
      failed === 0 ? "COMPLETED" : sent === 0 ? "FAILED" : "PARTIAL";

    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: {
        sentCount: sent,
        failedCount: failed,
        totalRecipients: total,
        status: finalStatus,
        completedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, finished: broadcast.id, status: finalStatus });
  }

  const templateParams =
    Array.isArray(broadcast.templateParams)
      ? (broadcast.templateParams as string[])
      : [];

  let sent = 0;
  let failed = 0;

  for (const recipient of pending) {
    const result = await sendWhatsAppTemplate({
      to: recipient.phone,
      templateName: broadcast.templateName,
      languageCode: broadcast.templateLanguage,
      parameters: templateParams,
    });

    if (result.success) {
      sent += 1;
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "SENT",
          messageId: result.messageId ?? null,
          sentAt: new Date(),
        },
      });
    } else {
      failed += 1;
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "FAILED",
          error: result.error.slice(0, 500),
        },
      });
    }

    if (INTER_MESSAGE_DELAY_MS > 0) await delay(INTER_MESSAGE_DELAY_MS);
  }

  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: {
      sentCount: { increment: sent },
      failedCount: { increment: failed },
    },
  });

  const remaining = await prisma.broadcastRecipient.count({
    where: { broadcastId: broadcast.id, status: "PENDING" },
  });

  return NextResponse.json({
    ok: true,
    broadcastId: broadcast.id,
    processed: pending.length,
    sent,
    failed,
    remaining,
  });
}
