import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { storefrontListingWhere } from "@/lib/storefront-products";
import { getSiteUrl } from "@/lib/site-url";
import { ProductDetailClient } from "./product-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, faqSchema, type FaqItem } from "@/lib/schema";
import type { Product } from "@prisma/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function pickPrimaryVariant<T extends { isDefault: boolean; stock: number }>(variants: T[]) {
  return (
    variants.find((v) => v.isDefault && v.stock > 0) ??
    variants.find((v) => v.stock > 0) ??
    variants[0]
  );
}

async function getProduct(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE", isActive: true },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      images: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!product) return null;
  if (!product.variants.some((v) => v.stock > 0)) return null;
  return product;
}

async function getRelatedProducts(categoryId: string, excludeId: string) {
  return prisma.product.findMany({
    where: storefrontListingWhere({}, { categoryId, id: { not: excludeId } }),
    take: 4,
    include: {
      category: { select: { name: true, slug: true } },
      variants: {
        where: { isActive: true, stock: { gt: 0 } },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, price: true, mrp: true, stock: true, isDefault: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true, altText: true, isPrimary: true },
      },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      _count: { select: { reviews: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };

  const defaultVariant = pickPrimaryVariant(product.variants);
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const canonicalPath = `/products/${slug}`;
  const ogImage = image?.url
    ? image.url.startsWith("http")
      ? image.url
      : `${getSiteUrl()}${image.url.startsWith("/") ? "" : "/"}${image.url}`
    : undefined;

  return {
    title: product.metaTitle ?? `${product.name} — Magadh Recipe`,
    description:
      product.metaDesc ??
      product.shortDescription ??
      `Buy ${product.name} online. Authentic handcrafted ${product.category.name} from Bihar.`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      url: canonicalPath,
      title: product.name,
      description: product.shortDescription ?? "",
      images: ogImage ? [{ url: ogImage, alt: product.name }] : [],
    },
    other: {
      "product:price:amount": String(defaultVariant?.price ?? 0),
      "product:price:currency": "INR",
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.categoryId, product.id);

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  // Structured data for product
  const defaultVariant = pickPrimaryVariant(product.variants);
  const site = getSiteUrl();
  const productPath = `/products/${slug}`;
  const productUrl = `${site}${productPath}`;
  const absImage = (url: string) =>
    url.startsWith("http") ? url : `${site}${url.startsWith("/") ? "" : "/"}${url}`;

  const reviewSchema =
    product.reviews.length > 0
      ? product.reviews.slice(0, 12).map((r) => ({
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
          author: { "@type": "Person", name: r.user?.name?.trim() || "Verified buyer" },
          reviewBody: [r.title, r.body].filter(Boolean).join(". ").slice(0, 5000),
          datePublished: r.createdAt.toISOString().split("T")[0],
        }))
      : undefined;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? "",
    url: productUrl,
    image: product.images.map((i) => absImage(i.url)),
    brand: { "@type": "Brand", name: "Magadh Recipe" },
    ...(defaultVariant && {
      offers: {
        "@type": "Offer",
        url: productUrl,
        price: defaultVariant.price,
        priceCurrency: "INR",
        availability:
          defaultVariant.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Magadh Recipe" },
      },
    }),
    ...(avgRating > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: product.reviews.length,
        bestRating: "5",
        worstRating: "1",
      },
    }),
    ...(reviewSchema && { review: reviewSchema }),
  };

  const relatedCardData = relatedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    spiceLevel: p.spiceLevel,
    isVeg: p.isVeg,
    isBestseller: p.isBestseller,
    isNewArrival: p.isNewArrival,
    category: p.category,
    images: p.images,
    variants: p.variants,
    avgRating:
      p.reviews.length > 0
        ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        : 0,
    reviewCount: p._count.reviews,
  }));

  const breadcrumbs = breadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    {
      label: product.category.name,
      href: `/products?category=${product.category.slug}`,
    },
    { label: product.name, href: productPath },
  ]);

  const faqItems = buildProductFaqItems(product);

  return (
    <>
      <JsonLd
        data={[productSchema, breadcrumbs, faqSchema(faqItems)]}
        id="product-detail"
      />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedCardData}
        avgRating={avgRating}
      />
    </>
  );
}

/**
 * Derive useful FAQ entries from product content fields. Only emits items that
 * actually have data, so we never publish empty/boilerplate FAQ schema.
 */
function buildProductFaqItems(product: Product & { category: { name: string } }): FaqItem[] {
  const items: FaqItem[] = [];

  if (product.ingredients) {
    items.push({
      question: `What are the ingredients in ${product.name}?`,
      answer: product.ingredients,
    });
  }
  if (product.storageInstructions) {
    items.push({
      question: `How should I store ${product.name}?`,
      answer: product.storageInstructions,
    });
  }
  if (product.shelfLife) {
    items.push({
      question: `How long does ${product.name} stay fresh?`,
      answer: product.shelfLife,
    });
  }
  if (product.usageSuggestions) {
    items.push({
      question: `How do I enjoy ${product.name}?`,
      answer: product.usageSuggestions,
    });
  }
  if (product.isVeg) {
    items.push({
      question: `Is ${product.name} vegetarian?`,
      answer: `Yes — ${product.name} is 100% vegetarian.`,
    });
  }
  items.push({
    question: `Does ${product.name} contain preservatives?`,
    answer: `No. ${product.name}, like every Magadh Recipe product, is handcrafted without artificial preservatives, colours or flavours. We rely on traditional techniques, cold-pressed mustard oil, and whole spices for natural preservation.`,
  });

  return items;
}
