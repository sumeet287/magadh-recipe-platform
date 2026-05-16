import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  isAmazonSpApiConfigured,
  syncAmazonMissingMarketplaceLines,
  syncAmazonOrdersFromSpApi,
  syncAmazonOrdersHistoricalCreatedHeaders,
} from "@/lib/amazon/sp-api-orders-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Default 120s — historical jobs may need several runs on slow SP-API limits or a higher cap on Vercel Pro */
export const maxDuration = 120;

type SyncBody = {
  /** LastUpdated-based pull (cron default) — last N days only */
  mode?: string;
};

/**
 * POST /api/admin/amazon/sync-orders
 * Body (JSON):
 * - `{}` or `{ "mode": "incremental" }` — recent updates (see AMAZON_ORDERS_SYNC_LOOKBACK_DAYS)
 * - `{ "mode": "historical" }` — Created-date backfill up to ~AMAZON_ORDERS_HISTORICAL_CREATED_DAYS (SP-API ~2y cap)
 * - `{ "mode": "lines" }` — fill `getOrderItems` for rows that have zero line items (batch size from env)
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isAmazonSpApiConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Amazon SP-API is not configured. Add LWA_CLIENT_ID, LWA_CLIENT_SECRET, and LWA_REFRESH_TOKEN to your environment.",
      },
      { status: 400 }
    );
  }

  let body: SyncBody = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = (body.mode ?? "incremental").trim().toLowerCase();

  if (mode === "lines") {
    const result = await syncAmazonMissingMarketplaceLines();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  }

  if (mode === "historical") {
    const result = await syncAmazonOrdersHistoricalCreatedHeaders();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  }

  const result = await syncAmazonOrdersFromSpApi();

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
