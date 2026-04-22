import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runContentEngine } from "@/lib/content-engine/engine";
import type { TopicBucket } from "@/lib/content-engine/topics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const VALID_BUCKETS: TopicBucket[] = [
  "cultural",
  "recipe",
  "comparison",
  "health",
  "trend",
  "seasonal",
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: {
    bucket?: string;
    topicSlug?: string;
    publish?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const bucket =
    body.bucket && VALID_BUCKETS.includes(body.bucket as TopicBucket)
      ? (body.bucket as TopicBucket)
      : undefined;

  try {
    const result = await runContentEngine({
      trigger: "manual",
      bucketOverride: bucket,
      topicSlug: body.topicSlug,
      autoPublish: typeof body.publish === "boolean" ? body.publish : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
