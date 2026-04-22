import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { blogCollectionSchema } from "@/lib/schema";
import { ArrowRight, Clock, BookOpen } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Magadh Recipe Journal — Bihari Food, Pickles & Stories",
  description:
    "Recipes, stories, and guides about Bihari food, pickle traditions, and regional specialities. Written by the Magadh Recipe kitchen team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Magadh Recipe Journal — Bihari Food & Pickle Stories",
    description:
      "Recipes, stories, and guides about Bihari food and pickle traditions.",
    url: "/blog",
    type: "website",
  },
};

async function getPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null, lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
    },
  });
}

export default async function BlogIndexPage() {
  const site = getSiteUrl();
  const posts = await getPublishedPosts();

  const categories = Array.from(
    new Map(
      posts
        .filter((p) => p.category)
        .map((p) => [p.category!.slug, p.category!])
    ).values()
  );

  const [featured, ...rest] = posts;

  return (
    <>
      <JsonLd
        data={blogCollectionSchema(
          posts.map((p) => ({
            title: p.title,
            slug: p.slug,
            publishedAt: p.publishedAt ?? undefined,
            excerpt: p.excerpt ?? undefined,
          }))
        )}
        id="blog-collection"
      />

      <div className="bg-hero-gradient text-cream-100 py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs
            items={[{ label: "The Journal", href: "/blog" }]}
            onDark
            className="mb-4"
          />
          <p className="text-brand-400 text-sm uppercase tracking-widest mb-1">
            The Journal
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            Stories, recipes & guides from our kitchen
          </h1>
          <p className="text-cream-300 text-sm mt-2 max-w-2xl">
            Written by the Magadh Recipe team — on Bihari food traditions, pickle craft,
            regional specialities and the stories behind every jar.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-earth-300 mx-auto mb-4" />
            <h2 className="font-serif text-xl text-earth-dark mb-2">
              Journal coming soon
            </h2>
            <p className="text-earth-500 text-sm">
              We&apos;re writing the first pieces. Check back shortly.
            </p>
          </div>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-8">
                <Link
                  href="/blog"
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-earth-dark text-cream-100"
                >
                  All
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/blog/category/${c.slug}`}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-cream-100 text-earth-700 hover:bg-brand-50 transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid md:grid-cols-2 gap-6 mb-12 bg-white border border-earth-200/60 rounded-3xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative aspect-[4/3] md:aspect-auto bg-cream-200">
                  {featured.coverImage && (
                    <Image
                      src={featured.coverImage}
                      alt={featured.coverImageAlt ?? featured.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      priority
                    />
                  )}
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest text-brand-600 font-semibold mb-3">
                    {featured.category?.name ?? "Featured"}
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-earth-dark leading-tight mb-3 group-hover:text-brand-700 transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-earth-600 leading-relaxed mb-4 line-clamp-3">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-earth-500 mb-4">
                    {featured.publishedAt && (
                      <time dateTime={featured.publishedAt.toISOString()}>
                        {formatDate(featured.publishedAt)}
                      </time>
                    )}
                    {featured.readTimeMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {featured.readTimeMinutes} min read
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:gap-2.5 transition-all">
                    Read the article
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-white border border-earth-200/60 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-cream-200">
                      {post.coverImage && (
                        <Image
                          src={post.coverImage}
                          alt={post.coverImageAlt ?? post.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      {post.category && (
                        <p className="text-[10px] uppercase tracking-wider text-brand-600 font-semibold mb-2">
                          {post.category.name}
                        </p>
                      )}
                      <h3 className="font-serif text-lg font-bold text-earth-dark leading-snug mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-earth-600 line-clamp-3 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-earth-500 mt-auto pt-2">
                        {post.publishedAt && (
                          <time dateTime={post.publishedAt.toISOString()}>
                            {formatDate(post.publishedAt)}
                          </time>
                        )}
                        {post.readTimeMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTimeMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
