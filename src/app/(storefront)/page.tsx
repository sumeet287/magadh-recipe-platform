import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { HeroBanner } from "@/components/storefront/hero-banner";
import { TrustBadges } from "@/components/storefront/trust-badges";
import { CategoriesSection } from "@/components/storefront/categories-section";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/types";
import { storefrontListingWhere } from "@/lib/storefront-products";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/schema";
import { LatestStories } from "@/components/storefront/latest-stories";

const IngredientReveal = dynamic(() => import("@/components/storefront/ingredient-reveal").then(m => m.IngredientReveal));
const ProcessStory = dynamic(() => import("@/components/storefront/process-story").then(m => m.ProcessStory));
const WhyChooseUs = dynamic(() => import("@/components/storefront/why-choose-us").then(m => m.WhyChooseUs));
const BrandStory = dynamic(() => import("@/components/storefront/why-choose-us").then(m => m.BrandStory));
const Testimonials = dynamic(() => import("@/components/storefront/testimonials").then(m => m.Testimonials));
const NewsletterSignup = dynamic(() => import("@/components/storefront/newsletter-signup").then(m => m.NewsletterSignup));

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Magadh Recipe — Maa ke Haath ka Swaad | Premium Handcrafted Pickles from Bihar",
  description:
    "Discover Magadh Recipe — born from a mother's kitchen in Bihar. Shop authentic handcrafted pickles, achars, masalas & gift hampers. No preservatives, cold-pressed mustard oil, FSSAI certified. 50,000+ happy families. Free delivery above ₹499.",
  openGraph: {
    title: "Magadh Recipe — माँ के हाथ का स्वाद | Premium Pickles from Bihar",
    description:
      "Born from a mother's kitchen — authentic handcrafted pickles & achars. 50,000+ happy families. No preservatives. Free shipping above ₹499. Shop now!",
  },
};

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: storefrontListingWhere({}, { isFeatured: true }),
      take: 8,
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { isActive: true, stock: { gt: 0 } },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            mrp: true,
            stock: true,
            isDefault: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, altText: true, isPrimary: true },
        },
        _count: { select: { reviews: true } },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return products.map((p) => ({
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
  } catch {
    return [];
  }
}

async function getBestsellers(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: storefrontListingWhere({}, { isBestseller: true }),
      take: 8,
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { isActive: true, stock: { gt: 0 } },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            mrp: true,
            stock: true,
            isDefault: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, altText: true, isPrimary: true },
        },
        _count: { select: { reviews: true } },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
    });

    return products.map((p) => ({
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
  } catch {
    return [];
  }
}

async function getNewArrivals(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: storefrontListingWhere({}, { isNewArrival: true }),
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { isActive: true, stock: { gt: 0 } },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            mrp: true,
            stock: true,
            isDefault: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, altText: true, isPrimary: true },
        },
        _count: { select: { reviews: true } },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
    });

    return products.map((p) => ({
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
  } catch {
    return [];
  }
}

function mergeSpotlightProducts(
  featured: ProductCardData[],
  bestsellers: ProductCardData[]
): ProductCardData[] {
  const seen = new Set<string>();
  const out: ProductCardData[] = [];
  for (const p of featured) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  for (const p of bestsellers) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out.slice(0, 8);
}

function ProductSection({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  href: string;
  products: ProductCardData[];
}) {
  if (!products.length) return null;

  return (
    <section
      className="py-16 md:py-20 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0d0603 0%, #1a0c06 50%, #120804 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16">
        <div className="flex items-end justify-between mb-14">
          <div>
            {subtitle && <p className="section-label text-brand-400/50 mb-4">{subtitle}</p>}
            <h2 className="font-serif text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08]">
              {title}
            </h2>
            <div className="mt-4 w-16 h-[2px] rounded-full bg-gradient-to-r from-brand-400 to-brand-200" />
          </div>
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-brand-300 border border-white/[0.06] hover:border-brand-400/30 px-7 py-3.5 rounded-full transition-all duration-300 group hover:bg-white/[0.02]"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <ProductGrid products={products} />

        <div className="mt-10 sm:hidden text-center">
          <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 border border-white/[0.08] px-6 py-3 rounded-full">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function StructuredData() {
  // Organization + WebSite are injected globally by `app/layout.tsx`.
  // Only emit page-specific schemas here.
  return (
    <JsonLd
      data={breadcrumbSchema([{ label: "Home", href: "/" }])}
      id="home-breadcrumb"
    />
  );
}

export default async function HomePage() {
  const [featuredProducts, bestsellers, newArrivals] = await Promise.all([
    getFeaturedProducts(),
    getBestsellers(),
    getNewArrivals(),
  ]);
  const spotlightProducts = mergeSpotlightProducts(featuredProducts, bestsellers);

  return (
    <>
      <StructuredData />

      {/* Hero */}
      <HeroBanner />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Categories */}
      <CategoriesSection />

      {/* Ingredient Marquee */}
      <IngredientReveal />

      {/* Featured + bestsellers (deduped) */}
      <ProductSection
        title="Featured & bestsellers"
        subtitle="Hand-picked favourites"
        href="/products"
        products={spotlightProducts}
      />

      {/* Our Process storytelling */}
      <ProcessStory />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <ProductSection
          title="New Arrivals"
          subtitle="Just In"
          href="/products?isNewArrival=true"
          products={newArrivals}
        />
      )}

      {/* Brand Story */}
      <BrandStory />

      {/* Latest Stories from the blog */}
      <LatestStories />

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <NewsletterSignup />
    </>
  );
}
