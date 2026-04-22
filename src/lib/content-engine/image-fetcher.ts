/**
 * Cover image fetcher for auto-generated blog posts.
 *
 * Uses free stock photo APIs (commercial-use, zero attribution required)
 * to pick a relevant landscape photo for each post.
 *
 *   Pexels  (primary)  — https://www.pexels.com/api/     — free 200 req/hr
 *   Unsplash (fallback) — https://unsplash.com/developers — free 50 req/hr demo
 *
 * Env:
 *   PEXELS_API_KEY      recommended primary
 *   UNSPLASH_ACCESS_KEY optional fallback
 */

import type { TopicSeed } from "./topics";

export type CoverImage = {
  url: string;
  alt: string;
  credit?: string; // photographer name, optional metadata for future use
  source: "pexels" | "unsplash";
};

type PexelsPhoto = {
  src: { large2x?: string; large?: string; original?: string };
  alt?: string;
  photographer?: string;
  width?: number;
  height?: number;
};

type UnsplashPhoto = {
  urls: { regular?: string; full?: string };
  alt_description?: string;
  user?: { name?: string };
  width?: number;
  height?: number;
};

/**
 * Build a list of search queries from a topic in priority order.
 * We try specific → broad so the best-matched photo wins while still
 * guaranteeing we get *something* usable.
 */
function buildQueries(topic: TopicSeed): string[] {
  const primary = topic.primaryKeyword.toLowerCase();
  const queries = new Set<string>();

  // 1. Exact primary keyword
  queries.add(primary);

  // 2. Core concept (strip brand/regional words for broader matches)
  const simplified = primary
    .replace(/\b(bihari|magadh|traditional|homemade|authentic|indian)\b/g, "")
    .trim();
  if (simplified && simplified !== primary) queries.add(simplified);

  // 3. Bucket-specific fallbacks — always Indian food aesthetic
  const bucketFallbacks: Record<TopicSeed["bucket"], string[]> = {
    cultural: ["indian pickle jar", "indian kitchen traditional", "indian food culture"],
    recipe: ["indian pickle", "mango pickle", "indian spices bowl"],
    comparison: ["indian pickle jar", "mustard oil", "indian food ingredients"],
    health: ["indian pickle bowl", "indian spices", "healthy indian food"],
    trend: ["indian food flat lay", "indian pickle", "indian food styling"],
    seasonal: ["indian pickle jar", "raw mango", "indian kitchen"],
  };
  bucketFallbacks[topic.bucket].forEach((q) => queries.add(q));

  // 4. Absolute safety-net
  queries.add("indian pickle");
  queries.add("indian food");

  return Array.from(queries);
}

/* ------------------------------ PEXELS ------------------------------ */

async function searchPexels(query: string, apiKey: string): Promise<CoverImage | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query,
  )}&per_page=15&orientation=landscape&size=large`;
  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    // Short timeout via AbortController (Pexels is usually fast).
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { photos?: PexelsPhoto[] };
  const photos = json.photos ?? [];
  if (photos.length === 0) return null;

  // Prefer wider landscape shots — better for blog covers.
  const candidate =
    photos.find(
      (p) => p.width && p.height && p.width / p.height >= 1.4 && p.width / p.height <= 2,
    ) ?? photos[0];

  const imgUrl = candidate.src.large2x ?? candidate.src.large ?? candidate.src.original;
  if (!imgUrl) return null;

  return {
    url: imgUrl,
    alt: candidate.alt?.trim() || "",
    credit: candidate.photographer ?? undefined,
    source: "pexels",
  };
}

/* ----------------------------- UNSPLASH ----------------------------- */

async function searchUnsplash(
  query: string,
  accessKey: string,
): Promise<CoverImage | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query,
  )}&per_page=15&orientation=landscape&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: UnsplashPhoto[] };
  const results = json.results ?? [];
  if (results.length === 0) return null;

  const candidate = results[0];
  const imgUrl = candidate.urls.regular ?? candidate.urls.full;
  if (!imgUrl) return null;

  return {
    url: imgUrl,
    alt: candidate.alt_description?.trim() || "",
    credit: candidate.user?.name ?? undefined,
    source: "unsplash",
  };
}

/* ------------------------------ PUBLIC ------------------------------ */

/**
 * Resolve a cover image for the given topic. Tries every configured provider
 * with a cascade of queries (specific → broad). Returns null only if every
 * provider fails entirely (in which case engine will just skip the image).
 */
export async function fetchCoverImage(topic: TopicSeed): Promise<CoverImage | null> {
  const pexelsKey = process.env.PEXELS_API_KEY?.trim();
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.trim();

  if (!pexelsKey && !unsplashKey) return null;

  const queries = buildQueries(topic);

  // 1. Try Pexels across all queries first (higher quota, no attribution).
  if (pexelsKey) {
    for (const q of queries) {
      try {
        const img = await searchPexels(q, pexelsKey);
        if (img) return img;
      } catch {
        // swallow and try next query
      }
    }
  }

  // 2. Fall back to Unsplash.
  if (unsplashKey) {
    for (const q of queries) {
      try {
        const img = await searchUnsplash(q, unsplashKey);
        if (img) return img;
      } catch {
        // swallow and try next query
      }
    }
  }

  return null;
}

/** Fetch a cover image for a raw primary keyword — used by the backfill job. */
export async function fetchCoverImageByKeyword(
  keyword: string,
  bucket: TopicSeed["bucket"] = "cultural",
): Promise<CoverImage | null> {
  const pseudoTopic: TopicSeed = {
    bucket,
    title: keyword,
    slug: keyword,
    angle: "",
    primaryKeyword: keyword,
    secondaryKeywords: [],
    intent: "informational",
    schemaType: "ARTICLE",
  };
  return fetchCoverImage(pseudoTopic);
}
