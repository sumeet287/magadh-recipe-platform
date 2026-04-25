import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendAbandonedCheckoutCoupon,
  normalizeWhatsappNumber,
  isWhatsappTemplatesReady,
  TEMPLATES_NOT_READY_MESSAGE,
} from "@/lib/whatsapp";
import { APP_URL } from "@/lib/constants";

/**
 * Vercel Cron: /api/cron/abandoned-checkouts
 *
 * Scans CheckoutSession rows that are STARTED, idle for more than
 * ABANDONED_CHECKOUT_DELAY_MINUTES, have a usable phone, and haven't been
 * offered a recovery coupon yet. Generates a 5% coupon (3-day expiry,
 * single-use, single-user) and sends it via WhatsApp.
 *
 * Rules (from product spec):
 *   - At any point a user can have only 1 active abandoned-checkout coupon
 *   - Each coupon: 5% off, max apply 1 per order (we don't stack coupons anyway)
 *   - Coupon valid for 3 days
 *   - Only runs for sessions with total >= MIN_CART_VALUE so we don't chase tiny carts
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const ABANDONED_CHECKOUT_DELAY_MINUTES = Number(
  process.env.ABANDONED_CHECKOUT_DELAY_MINUTES ?? 30
);
const ABANDONED_COUPON_PERCENT = 5;
const ABANDONED_COUPON_VALIDITY_DAYS = 3;
const MIN_CART_VALUE = 299;
const BATCH_SIZE = 25;
const COUPON_PREFIX = "COMEBACK";

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  const queryToken = req.nextUrl.searchParams.get("token");
  return Boolean(queryToken) && queryToken === secret;
}

function randomCouponCode(prefix: string): string {
  const n = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${n}`;
}

type SessionRow = {
  id: string;
  userId: string | null;
  phone: string | null;
  name: string | null;
  email: string | null;
  totalAmount: number;
};

type ProcessResult =
  | { skipped: string }
  | { sent: true; couponCode: string; to: string }
  | { sent: false; error: string; couponCode: string }
  | { error: string };

async function processSession(row: SessionRow): Promise<ProcessResult> {
  const normalizedPhone = normalizeWhatsappNumber(row.phone);
  if (!normalizedPhone) {
    await prisma.checkoutSession.update({
      where: { id: row.id },
      data: { status: "ABANDONED" },
    });
    return { skipped: "no-phone" };
  }

  // Skip if this user already has an active COMEBACK coupon they haven't used yet
  const existingActive = await prisma.coupon.findFirst({
    where: {
      code: { startsWith: `${COUPON_PREFIX}-` },
      isActive: true,
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      ...(row.userId
        ? { usages: { some: { userId: row.userId, orderId: null } } }
        : {}),
      usedCount: 0,
    },
    select: { id: true },
  });
  if (existingActive) {
    await prisma.checkoutSession.update({
      where: { id: row.id },
      data: { status: "ABANDONED" },
    });
    return { skipped: "existing-active-coupon" };
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + ABANDONED_COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  );

  let coupon;
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = randomCouponCode(COUPON_PREFIX);
    try {
      coupon = await prisma.coupon.create({
        data: {
          code,
          description: `Abandoned checkout recovery — ${ABANDONED_COUPON_PERCENT}% off`,
          type: "PERCENTAGE",
          value: ABANDONED_COUPON_PERCENT,
          minOrderAmount: MIN_CART_VALUE,
          usageLimit: 1,
          perUserLimit: 1,
          isActive: true,
          startDate: now,
          endDate: expiresAt,
        },
      });
      break;
    } catch {
      // code collision — retry
    }
  }
  if (!coupon) return { skipped: "coupon-create-failed" };

  const recoveryUrl = `${APP_URL}/checkout?coupon=${coupon.code}`;
  const customerName = row.name?.split(" ")[0] ?? "there";

  const send = await sendAbandonedCheckoutCoupon({
    to: normalizedPhone,
    customerName,
    couponCode: coupon.code,
    expiresAt,
    recoveryUrl,
  });

  await prisma.checkoutSession.update({
    where: { id: row.id },
    data: {
      status: "ABANDONED",
      couponId: coupon.id,
      couponSentAt: send.success ? new Date() : null,
    },
  });

  if (send.success) {
    return { sent: true, couponCode: coupon.code, to: normalizedPhone };
  }
  return { sent: false, error: send.error, couponCode: coupon.code };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isWhatsappTemplatesReady()) {
    return NextResponse.json({
      ok: true,
      paused: true,
      reason: TEMPLATES_NOT_READY_MESSAGE,
    });
  }

  const cutoff = new Date(
    Date.now() - ABANDONED_CHECKOUT_DELAY_MINUTES * 60 * 1000
  );

  const candidates = await prisma.checkoutSession.findMany({
    where: {
      status: "STARTED",
      lastActivityAt: { lt: cutoff },
      couponSentAt: null,
      phone: { not: null },
      totalAmount: { gte: MIN_CART_VALUE },
    },
    select: {
      id: true,
      userId: true,
      phone: true,
      name: true,
      email: true,
      totalAmount: true,
    },
    orderBy: { lastActivityAt: "asc" },
    take: BATCH_SIZE,
  });

  const results: Array<{ id: string; result: ProcessResult }> = [];
  for (const row of candidates) {
    try {
      const result = await processSession(row);
      results.push({ id: row.id, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      results.push({ id: row.id, result: { error: message } });
    }
  }

  // Mark very old STARTED sessions as EXPIRED (7 days idle) so they don't hang around.
  const expiryCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.checkoutSession.updateMany({
    where: {
      status: "STARTED",
      lastActivityAt: { lt: expiryCutoff },
    },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({
    ok: true,
    scanned: candidates.length,
    processed: results,
    delayMinutes: ABANDONED_CHECKOUT_DELAY_MINUTES,
  });
}
