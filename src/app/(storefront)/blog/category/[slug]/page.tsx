import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  return prisma.blogCategory.findUnique({
    where: { slug },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: `${cat.name} — Magadh Recipe Journal`,
    description:
      cat.description ??
      `Articles and guides in ${cat.name} from the Magadh Recipe Journal.`,
    alternates: { canonical: `/blog/category/${cat.slug}` },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { not: null, lte: new Date() },
      categoryId: category.id,
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <div className="bg-hero-gradient text-cream-100 py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "The Journal", href: "/blog" },
              { label: category.name, href: `/blog/category/${category.slug}` },
            ]}
            onDark
            className="mb-4"
          />
          <p className="text-brand-400 text-sm uppercase tracking-widest mb-1">
            Journal · Category
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-cream-300 text-sm mt-2 max-w-2xl">
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {posts.length === 0 ? (
          <p className="text-sm text-earth-500 text-center py-20">
            No articles in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
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
                  <h2 className="font-serif text-lg font-bold text-earth-dark leading-snug mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
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
      </div>
    </div>
  );
}
