import { NextRequest, NextResponse } from "next/server";
import { runContentEngine } from "@/lib/content-engine/engine";

/**
 * Vercel Cron endpoint — runs on the schedule defined in vercel.json
 * and triggers autonomous blog generation.
 *
 * Auth: one of the following must succeed
 *   1. Vercel cron header: `x-vercel-cron: 1` (sent by the Vercel cron runner)
 *   2. Bearer token: `Authorization: Bearer <CRON_SECRET>` (for external cron / manual)
 *
 * Query params (optional):
 *   ?bucket=cultural|recipe|comparison|health|trend|seasonal
 *   ?topic=<seed-slug>
 *   ?publish=true|false   (override BLOG_AUTO_PUBLISH)
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  if (header === `Bearer ${secret}`) return true;
  const queryToken = req.nextUrl.searchParams.get("token");
  if (queryToken && queryToken === secret) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const bucket = sp.get("bucket") ?? undefined;
  const topicSlug = sp.get("topic") ?? undefined;
  const publishParam = sp.get("publish");
  const autoPublish =
    publishParam === null ? undefined : publishParam === "true";

  try {
    const result = await runContentEngine({
      trigger: "cron",
      bucketOverride:
        bucket &&
        ["cultural", "recipe", "comparison", "health", "trend", "seasonal"].includes(bucket)
          ? (bucket as Parameters<typeof runContentEngine>[0]["bucketOverride"])
          : undefined,
      topicSlug: topicSlug ?? undefined,
      autoPublish,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
