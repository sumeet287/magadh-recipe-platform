import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isAmazonSpApiConfigured, syncAmazonOrdersFromSpApi } from "@/lib/amazon/sp-api-orders-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/admin/amazon/sync-orders
 * Admin session only — runs the same job as the cron route.
 */
export async function POST() {
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

  const result = await syncAmazonOrdersFromSpApi();
  return NextResponse.json(result, { status: 200 });
}
