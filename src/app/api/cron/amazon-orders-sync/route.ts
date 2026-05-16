import { NextRequest, NextResponse } from "next/server";

import { isAmazonSpApiConfigured, syncAmazonOrdersFromSpApi } from "@/lib/amazon/sp-api-orders-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return true;
  const queryToken = req.nextUrl.searchParams.get("token");
  return Boolean(queryToken && queryToken === secret);
}

/**
 * Vercel Cron or manual: GET /api/cron/amazon-orders-sync
 * Auth: x-vercel-cron, Bearer CRON_SECRET, or ?token=CRON_SECRET
 *
 * Fetches orders updated in the last AMAZON_ORDERS_SYNC_LOOKBACK_DAYS (default 21)
 * and upserts into amazon_marketplace_orders (+ line items for the newest chunk).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isAmazonSpApiConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        reason: "LWA / refresh token env not set (LWA_CLIENT_ID, LWA_CLIENT_SECRET, LWA_REFRESH_TOKEN).",
      },
      { status: 200 }
    );
  }

  const result = await syncAmazonOrdersFromSpApi();
  return NextResponse.json(result, { status: 200 });
}
