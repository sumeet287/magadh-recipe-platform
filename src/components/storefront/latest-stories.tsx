import Link from "next/link";
import NextImage from "next/image";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type StoryCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: Date | null;
  readTimeMinutes: number | null;
  categoryName: string | null;
};

async function fetchLatestStories(): Promise<StoryCard[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { category: { select: { name: true } } },
    });
    return posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      coverImageAlt: p.coverImageAlt,
      publishedAt: p.publishedAt,
      readTimeMinutes: p.readTimeMinutes,
      categoryName: p.category?.name ?? null,
    }));
  } catch {
    return [];
  }
}

export async function LatestStories() {
  const stories = await fetchLatestStories();
  if (stories.length === 0) return null;

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #120804 0%, #1a0c06 50%, #0d0603 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="section-label text-brand-400/50 mb-4">From Our Journal</p>
            <h2 className="font-serif text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08]">
              Stories &amp; Recipes
            </h2>
            <p className="text-white/60 mt-4 max-w-lg text-[15px] leading-relaxed">
              Bihari food culture, forgotten recipes, and the craft behind every jar —
              straight from our kitchen and archives.
            </p>
            <div className="mt-5 w-16 h-[2px] rounded-full bg-gradient-to-r from-brand-400 to-brand-200" />
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-brand-300 border border-white/[0.08] hover:border-brand-400/30 px-7 py-3.5 rounded-full transition-all duration-300 group hover:bg-white/[0.02]"
          >
            All stories
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {stories.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl overflow-hidden bg-[#0f0703]/70 border border-white/[0.06] hover:border-brand-400/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(212,132,58,0.35)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-earth-900">
                {post.coverImage ? (
                  <NextImage
                    src={post.coverImage}
                    alt={post.coverImageAlt ?? post.title}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 768px) 33vw, 100vw"
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-out"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-900/40 via-earth-900 to-earth-950">
                    <BookOpen className="w-10 h-10 text-brand-400/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {post.categoryName ? (
                  <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full bg-brand-500/90 text-white backdrop-blur">
                    {post.categoryName}
                  </span>
                ) : null}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-[11px] text-white/40 uppercase tracking-wider mb-3">
                  {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
                  {post.readTimeMinutes ? (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTimeMinutes} min read
                      </span>
                    </>
                  ) : null}
                </div>
                <h3 className="font-serif text-xl lg:text-[22px] font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p className="text-sm text-white/60 leading-relaxed mt-3 line-clamp-3">
                    {post.excerpt}
                  </p>
                ) : null}
                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 group-hover:text-brand-300 transition-colors">
                  Read story
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 sm:hidden text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 border border-white/[0.08] px-6 py-3 rounded-full"
          >
            All stories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
