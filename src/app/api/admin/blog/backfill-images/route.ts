import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { fetchCoverImageByKeyword } from "@/lib/content-engine/image-fetcher";
import { TOPIC_SEEDS } from "@/lib/content-engine/topics";
import type { TopicBucket } from "@/lib/content-engine/topics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Backfill cover images for all published/draft blog posts that are missing one.
 * Uses the post's first tag (if it matches a topic seed bucket) or falls back
 * to the post title as the keyword.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const onlyMissing = req.nextUrl.searchParams.get("all") !== "true";

  const posts = await prisma.blogPost.findMany({
    where: onlyMissing
      ? { OR: [{ coverImage: null }, { coverImage: "" }] }
      : {},
    select: { id: true, slug: true, title: true, tags: true, metaKeywords: true },
  });

  if (posts.length === 0) {
    return NextResponse.json({
      ok: true,
      updated: 0,
      skipped: 0,
      failed: 0,
      message: "No posts need a cover image.",
    });
  }

  const validBuckets: TopicBucket[] = [
    "cultural",
    "recipe",
    "comparison",
    "health",
    "trend",
    "seasonal",
  ];

  let updated = 0;
  let failed = 0;
  const failures: Array<{ slug: string; reason: string }> = [];

  for (const post of posts) {
    try {
      // Resolve a bucket hint from tags, or seed match by slug.
      const seed = TOPIC_SEEDS.find((t) => t.slug === post.slug);
      const tagBucket = post.tags.find((t) =>
        validBuckets.includes(t as TopicBucket),
      ) as TopicBucket | undefined;
      const bucket: TopicBucket = seed?.bucket ?? tagBucket ?? "cultural";

      // Prefer the post's first meta keyword, then slug-derived, then title.
      const keyword =
        (post.metaKeywords?.split(",")[0] || "").trim() ||
        post.title.replace(/[:—–-]/g, " ").split(" ").slice(0, 4).join(" ");

      const img = await fetchCoverImageByKeyword(keyword, bucket);
      if (!img?.url) {
        failed += 1;
        failures.push({ slug: post.slug, reason: "no image found" });
        continue;
      }

      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          coverImage: img.url,
          coverImageAlt: img.alt || post.title,
        },
      });

      try {
        revalidatePath(`/blog/${post.slug}`);
      } catch {
        // ignore in non-request context
      }
      updated += 1;
    } catch (err) {
      failed += 1;
      failures.push({
        slug: post.slug,
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  try {
    revalidatePath("/blog");
    revalidatePath("/");
  } catch {
    // ignore
  }

  return NextResponse.json({
    ok: true,
    scanned: posts.length,
    updated,
    failed,
    failures: failures.slice(0, 10),
  });
}
