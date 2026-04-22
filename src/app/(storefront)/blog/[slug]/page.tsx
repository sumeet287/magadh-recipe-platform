import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Calendar, ArrowLeft, ChefHat } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqBlock } from "@/components/storefront/faq-block";
import { JsonLd } from "@/components/seo/json-ld";
import {
  articleSchema,
  recipeSchema,
  faqSchema,
  type FaqItem,
} from "@/lib/schema";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    return await prisma.blogPost.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        publishedAt: { not: null, lte: new Date() },
      },
      include: {
        category: { select: { name: true, slug: true } },
      },
    });
  } catch (err) {
    console.error("[/blog/[slug]] failed to load post:", err);
    return null;
  }
}

async function getRelatedPosts(categoryId: string | null, excludeId: string) {
  try {
    return await prisma.blogPost.findMany({
      where: {
        id: { not: excludeId },
        status: "PUBLISHED",
        publishedAt: { not: null, lte: new Date() },
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        coverImageAlt: true,
        publishedAt: true,
        readTimeMinutes: true,
      },
    });
  } catch (err) {
    console.error("[/blog/[slug]] failed to load related posts:", err);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };

  const site = getSiteUrl();
  const canonical = `/blog/${post.slug}`;
  const ogImage = post.ogImage ?? post.coverImage ?? undefined;

  return {
    title: post.metaTitle ?? `${post.title} | Magadh Recipe Journal`,
    description:
      post.metaDesc ??
      post.excerpt ??
      `${post.title} — from the Magadh Recipe Journal.`,
    keywords: post.metaKeywords
      ? post.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
      : post.tags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.excerpt ?? "",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags,
      images: ogImage
        ? [
            {
              url: ogImage.startsWith("http") ? ogImage : `${site}${ogImage}`,
              width: 1200,
              height: 630,
              alt: post.coverImageAlt ?? post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? "",
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function parseFaqs(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r): r is FaqItem =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as FaqItem).question === "string" &&
        typeof (r as FaqItem).answer === "string"
    )
    .map((r) => ({ question: r.question.trim(), answer: r.answer.trim() }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.categoryId, post.id);
  const faqs = parseFaqs(post.faqs);

  const breadcrumbItems = [
    { label: "The Journal", href: "/blog" },
    ...(post.category
      ? [{ label: post.category.name, href: `/blog/category/${post.category.slug}` }]
      : []),
    { label: post.title, href: `/blog/${post.slug}` },
  ];

  const schemaImages = [post.coverImage, post.ogImage].filter((v): v is string =>
    Boolean(v)
  );

  const articleData =
    post.schemaType === "RECIPE"
      ? recipeSchema({
          name: post.title,
          description: post.excerpt ?? post.subtitle ?? post.title,
          slug: post.slug,
          images: schemaImages,
          authorName: post.authorName ?? undefined,
          publishedAt: post.publishedAt ?? undefined,
          prepTimeMinutes: post.prepTimeMinutes ?? undefined,
          cookTimeMinutes: post.cookTimeMinutes ?? undefined,
          recipeYield: post.recipeYield ?? undefined,
          recipeCuisine: post.recipeCuisine ?? undefined,
          recipeCategory: post.recipeCategoryName ?? undefined,
          ingredients: post.recipeIngredients,
          instructions: post.recipeInstructions,
          keywords: post.tags,
        })
      : articleSchema({
          headline: post.title,
          description: post.excerpt ?? post.subtitle ?? post.title,
          slug: post.slug,
          images: schemaImages,
          authorName: post.authorName ?? undefined,
          publishedAt: post.publishedAt ?? undefined,
          updatedAt: post.updatedAt,
          keywords: post.tags,
          articleSection: post.category?.name,
        });

  return (
    <>
      <JsonLd data={articleData} id="article" />
      <JsonLd data={faqSchema(faqs)} id="article-faq" />

      <article className="pb-16">
        {/* Hero */}
        <header className="bg-hero-gradient text-cream-100 py-10">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6">
            <Breadcrumbs
              items={breadcrumbItems}
              onDark
              className="mb-5"
            />
            {post.category && (
              <p className="text-brand-400 text-xs uppercase tracking-widest mb-2">
                {post.category.name}
              </p>
            )}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="text-cream-300 text-base md:text-lg mt-3">
                {post.subtitle}
              </p>
            )}
            <div className="flex items-center gap-5 text-xs text-cream-400 mt-5">
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <time dateTime={post.publishedAt.toISOString()}>
                    {formatDate(post.publishedAt)}
                  </time>
                </span>
              )}
              {post.readTimeMinutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTimeMinutes} min read
                </span>
              )}
              {post.authorName && (
                <span className="flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5" />
                  {post.authorName}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Cover */}
        {post.coverImage && (
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 -mt-6">
            <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl bg-cream-200">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt ?? post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 mt-10">
          {post.excerpt && (
            <p className="text-lg text-earth-700 leading-relaxed mb-8 italic border-l-2 border-brand-400 pl-4">
              {post.excerpt}
            </p>
          )}

          <div
            className="blog-prose text-earth-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Recipe panel */}
          {post.schemaType === "RECIPE" && (
            <RecipePanel
              ingredients={post.recipeIngredients}
              instructions={post.recipeInstructions}
              recipeYield={post.recipeYield}
              prepTimeMinutes={post.prepTimeMinutes}
              cookTimeMinutes={post.cookTimeMinutes}
              cuisine={post.recipeCuisine}
            />
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-10 pt-6 border-t border-earth-200/60">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-cream-100 text-earth-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <div className="mt-12">
              <FaqBlock items={faqs} title="Quick questions" />
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-14 pt-10 border-t border-earth-200/60">
              <h2 className="font-serif text-xl font-bold text-earth-dark mb-5">
                Keep reading
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="group flex flex-col gap-2"
                  >
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-cream-200">
                      {r.coverImage && (
                        <Image
                          src={r.coverImage}
                          alt={r.coverImageAlt ?? r.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-earth-dark group-hover:text-brand-700 transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-brand-700 mt-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to the Journal
          </Link>
        </div>
      </article>
    </>
  );
}

function RecipePanel({
  ingredients,
  instructions,
  recipeYield,
  prepTimeMinutes,
  cookTimeMinutes,
  cuisine,
}: {
  ingredients: string[];
  instructions: string[];
  recipeYield: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  cuisine: string | null;
}) {
  if (ingredients.length === 0 && instructions.length === 0) return null;
  const meta: { label: string; value: string }[] = [];
  if (prepTimeMinutes) meta.push({ label: "Prep time", value: `${prepTimeMinutes} min` });
  if (cookTimeMinutes) meta.push({ label: "Cook time", value: `${cookTimeMinutes} min` });
  if (recipeYield) meta.push({ label: "Serves", value: recipeYield });
  if (cuisine) meta.push({ label: "Cuisine", value: cuisine });

  return (
    <section className="mt-12 bg-cream-50 border border-earth-200/60 rounded-3xl p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-bold text-earth-dark mb-4 flex items-center gap-2">
        <ChefHat className="w-5 h-5 text-brand-600" />
        Recipe at a glance
      </h2>
      {meta.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {meta.map((m) => (
            <div
              key={m.label}
              className="bg-white rounded-xl p-3 border border-earth-200/50"
            >
              <p className="text-[10px] uppercase tracking-wider text-earth-500 font-semibold">
                {m.label}
              </p>
              <p className="text-sm text-earth-dark font-semibold mt-0.5">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      )}
      {ingredients.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-earth-dark mb-2">Ingredients</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-earth-700">
            {ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
      )}
      {instructions.length > 0 && (
        <div>
          <h3 className="font-semibold text-earth-dark mb-2">Method</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-earth-700">
            {instructions.map((step, i) => (
              <li key={i} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
