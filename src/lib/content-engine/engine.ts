/**
 * Content engine orchestrator.
 *
 * 1. Reads already-published slugs from DB.
 * 2. Picks the next topic (rotates by weekday, avoids duplicates).
 * 3. Calls the LLM generator.
 * 4. Persists the post to Prisma with a unique slug.
 * 5. Triggers revalidation of /blog and the sitemap.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { pickNextTopic, type TopicBucket, type TopicSeed } from "./topics";
import { generateBlogPayload, type BlogPayload } from "./generator";

export type EngineTriggerSource = "cron" | "manual" | "backfill";

export type EngineRunResult = {
  ok: true;
  postId: string;
  slug: string;
  title: string;
  status: "PUBLISHED" | "DRAFT";
  topicSlug: string;
  topicBucket: TopicBucket;
  trigger: EngineTriggerSource;
  durationMs: number;
};

export type EngineRunOptions = {
  trigger: EngineTriggerSource;
  bucketOverride?: TopicBucket;
  topicSlug?: string; // If provided, force-use this seed topic.
  autoPublish?: boolean; // Overrides BLOG_AUTO_PUBLISH env.
};

function resolveAutoPublish(explicit?: boolean): boolean {
  if (typeof explicit === "boolean") return explicit;
  const raw = (process.env.BLOG_AUTO_PUBLISH || "true").toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

async function findFreeSlug(candidate: string): Promise<string> {
  const base = slugify(candidate) || `post-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  while (
    // eslint-disable-next-line no-await-in-loop
    await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
    if (suffix > 50) {
      slug = `${base}-${Date.now()}`;
      break;
    }
  }
  return slug;
}

async function ensureDefaultCategory(): Promise<string | null> {
  const existing = await prisma.blogCategory.findFirst({
    where: { slug: "stories" },
    select: { id: true },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.blogCategory.create({
      data: {
        name: "Stories",
        slug: "stories",
        description: "Cultural, culinary and recipe stories from the Magadh kitchen.",
      },
    });
    return created.id;
  } catch {
    return null;
  }
}

async function resolveTopic(opts: EngineRunOptions): Promise<TopicSeed | null> {
  const publishedSlugs = new Set<string>();
  const posts = await prisma.blogPost.findMany({
    select: { slug: true },
  });
  posts.forEach((p) => publishedSlugs.add(p.slug));

  if (opts.topicSlug) {
    const { TOPIC_SEEDS } = await import("./topics");
    const match = TOPIC_SEEDS.find((t) => t.slug === opts.topicSlug);
    if (match) return match;
  }

  return pickNextTopic({
    publishedSlugs,
    bucketOverride: opts.bucketOverride,
  });
}

function selectCoverImage(topic: TopicSeed): string | null {
  const base = process.env.CONTENT_ENGINE_DEFAULT_COVER;
  return base && base.trim().length > 0 ? base.trim() : null;
}

export async function runContentEngine(
  opts: EngineRunOptions,
): Promise<EngineRunResult> {
  const startedAt = Date.now();
  const topic = await resolveTopic(opts);
  if (!topic) {
    throw new Error(
      "No unused topics left in the topic bank. Add more seeds to src/lib/content-engine/topics.ts.",
    );
  }

  const payload: BlogPayload = await generateBlogPayload(topic);

  const slug = await findFreeSlug(payload.slug || topic.slug);
  const categoryId = await ensureDefaultCategory();
  const autoPublish = resolveAutoPublish(opts.autoPublish);
  const status: "PUBLISHED" | "DRAFT" = autoPublish ? "PUBLISHED" : "DRAFT";

  const recipe = payload.recipe ?? null;
  const coverImage = selectCoverImage(topic);

  const tags = Array.from(
    new Set([...(payload.tags ?? []), "auto-generated", topic.bucket]),
  ).slice(0, 15);

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: payload.title,
      subtitle: payload.subtitle,
      excerpt: payload.excerpt,
      content: payload.content,
      coverImage,
      coverImageAlt: payload.coverImageAlt,
      categoryId,
      tags,
      readTimeMinutes: payload.readTimeMinutes,
      authorName: "Magadh Recipe",
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      metaTitle: payload.metaTitle,
      metaDesc: payload.metaDesc,
      metaKeywords: payload.metaKeywords,
      schemaType: topic.schemaType,
      recipeYield: recipe?.yield ?? null,
      prepTimeMinutes: recipe?.prepTimeMinutes ?? null,
      cookTimeMinutes: recipe?.cookTimeMinutes ?? null,
      recipeCuisine: recipe?.cuisine ?? null,
      recipeCategoryName: recipe?.categoryName ?? null,
      recipeIngredients: recipe?.ingredients ?? [],
      recipeInstructions: recipe?.instructions ?? [],
      faqs: payload.faqs as unknown as Prisma.InputJsonValue,
    },
  });

  try {
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/sitemap.xml");
  } catch {
    // revalidatePath can throw outside a request context (e.g. during tests).
  }

  return {
    ok: true,
    postId: post.id,
    slug: post.slug,
    title: post.title,
    status,
    topicSlug: topic.slug,
    topicBucket: topic.bucket,
    trigger: opts.trigger,
    durationMs: Date.now() - startedAt,
  };
}
