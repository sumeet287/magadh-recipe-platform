import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { storefrontListingWhere } from "@/lib/storefront-products";

/** Cache sitemap generation; reduces DB load and avoids cold-timeouts on each request. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/refund`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/shipping`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];
  let blogCategoryPages: MetadataRoute.Sitemap = [];

  try {
    const { prisma } = await import("@/lib/prisma");
    const products = await prisma.product.findMany({
      where: storefrontListingWhere({}),
      select: { slug: true, updatedAt: true },
    });
    productPages = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error("[sitemap] product URLs skipped:", err);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const posts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null, lte: new Date() },
      },
      select: { slug: true, updatedAt: true },
    });
    blogPages = posts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const categories = await prisma.blogCategory.findMany({
      where: { isActive: true, posts: { some: { status: "PUBLISHED" } } },
      select: { slug: true, updatedAt: true },
    });
    blogCategoryPages = categories.map((c) => ({
      url: `${baseUrl}/blog/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch (err) {
    console.error("[sitemap] blog URLs skipped:", err);
  }

  return [...staticPages, ...productPages, ...blogPages, ...blogCategoryPages];
}
