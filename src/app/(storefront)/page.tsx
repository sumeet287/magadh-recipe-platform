import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBanner } from "@/components/storefront/hero-banner";
import { TrustBadges } from "@/components/storefront/trust-badges";
import { CategoriesSection } from "@/components/storefront/categories-section";
import { IngredientReveal } from "@/components/storefront/ingredient-reveal";
import { ProcessStory } from "@/components/storefront/process-story";
import { WhyChooseUs, BrandStory } from "@/components/storefront/why-choose-us";
import { Testimonials } from "@/components/storefront/testimonials";
import { NewsletterSignup } from "@/components/storefront/newsletter-signup";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import type { ProductCardData } from "@/types";

export const metadata: Metadata = {
  title: "Magadh Recipe — Premium Handcrafted Pickles & Regional Food",
  description:
    "Shop authentic handcrafted pickles, masalas, and regional food products from Bihar. No preservatives, pure ingredients, delivered pan-India.",
  openGraph: {
    title: "Magadh Recipe — आचार की असली पहचान",
    description:
      "Premium handcrafted pickles from Bihar. 50,000+ happy customers. Free shipping above ₹499.",
  },
};

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, status: "ACTIVE", isActive: true },
      take: 8,
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { isActive: true },
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
      where: { isBestseller: true, status: "ACTIVE", isActive: true },
      take: 8,
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { isActive: true },
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
      where: { isNewArrival: true, status: "ACTIVE", isActive: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          where: { isActive: true },
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

// Section Wrapper Component — luxury dark edition
function ProductSection({
  title,
  subtitle,
  icon,
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
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1c0c04 0%, #0f0602 50%, #faf7f2 50%)" }}
    >
      {/* Dark top band */}
      <div className="absolute inset-x-0 top-0 h-[38%]" style={{ background: "linear-gradient(180deg, #0f0602 0%, #faf7f2 100%)" }} />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Premium section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            {subtitle && (
              <p className="luxury-num mb-4">{subtitle}</p>
            )}
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#1a0e07] flex items-center gap-2 leading-tight">
              {icon}
              <span>{title}</span>
            </h2>
            <div className="mt-3 w-12 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #D4843A, transparent)" }} />
          </div>
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 border border-brand-300/50 hover:border-brand-500 px-6 py-3 rounded-full transition-all duration-200 group tracking-wide"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <ProductGrid products={products} />

        <div className="mt-8 sm:hidden text-center">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 border border-brand-200 px-5 py-2.5 rounded-full"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Festive Banner
function FestiveBanner() {
  return (
    <section className="py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-[#1a0e07]">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=1400&q=70"
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0e07] via-[#1a0e07]/80 to-transparent" />
          </div>
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle, #D4843A 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 p-8 md:p-12">
            <div>
              <span className="inline-flex items-center gap-2 text-brand-400 text-xs font-bold tracking-widest uppercase mb-3">
                <span className="w-4 h-px bg-brand-500" /> Festival Season Offer
              </span>
              <h3 className="font-serif text-2xl md:text-4xl font-bold leading-tight text-white">
                10% Off on All
                <br />
                <span className="bg-gradient-to-r from-brand-400 to-turmeric-300 bg-clip-text text-transparent">Gift Hampers</span>
              </h3>
              <p className="text-white/50 text-sm mt-3">
                Use code{" "}
                <strong className="text-brand-400 bg-brand-500/10 border border-brand-500/30 px-2 py-0.5 rounded-lg font-mono">
                  FESTIVE10
                </strong>{" "}
                at checkout
              </p>
            </div>
            <Link
              href="/products?category=gift-boxes"
              className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white font-semibold text-sm px-7 py-4 rounded-2xl shadow-[0_4px_24px_rgba(212,132,58,0.4)] hover:shadow-[0_4px_32px_rgba(212,132,58,0.6)] transition-all duration-300 hover:-translate-y-0.5"
            >
              Shop Gift Boxes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
// JSON-LD Structured Data
function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Magadh Recipe",
    description: "Premium handcrafted pickles and regional food products from Bihar",
    url: process.env.NEXTAUTH_URL,
    logo: `${process.env.NEXTAUTH_URL}/images/brand/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9876543210",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["Hindi", "English"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Patna",
      addressRegion: "Bihar",
      postalCode: "800001",
      addressCountry: "IN",
    },
    sameAs: [
      "https://instagram.com/magadhrecipe",
      "https://facebook.com/magadhrecipe",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function HomePage() {
  const [featuredProducts, bestsellers, newArrivals] = await Promise.all([
    getFeaturedProducts(),
    getBestsellers(),
    getNewArrivals(),
  ]);

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

      {/* Featured Products */}
      <ProductSection
        title="Featured Products"
        subtitle="Hand-picked for you"
        icon={<Sparkles className="w-6 h-6 text-brand-500" />}
        href="/products?isFeatured=true"
        products={featuredProducts}
      />

      {/* Festive Banner */}
      <FestiveBanner />

      {/* Bestsellers */}
      <ProductSection
        title="Bestsellers"
        subtitle="Customer Favourites"
        icon={<Flame className="w-6 h-6 text-spice-500" />}
        href="/products?isBestseller=true"
        products={bestsellers}
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

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <NewsletterSignup />
    </>
  );
}
