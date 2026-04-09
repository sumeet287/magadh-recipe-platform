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
import { ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/types";

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

function FestiveBanner() {
  return (
    <section className="py-4 px-6 sm:px-8 lg:px-16" style={{ background: "#0d0603" }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#1a0c06]">
          <div className="absolute inset-0">
            <img src="/images/brand/banner.webp" alt="" className="w-full h-full object-cover opacity-15" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0c06] via-[#1a0c06]/85 to-transparent" />
          </div>
          <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 p-8 md:p-14">
            <div>
              <span className="inline-flex items-center gap-2.5 text-brand-400/70 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                <span className="w-5 h-px bg-brand-500" /> Festival Special
              </span>
              <h3 className="font-serif text-2xl md:text-4xl font-bold leading-[1.1] text-white">
                Share Maa&apos;s Love —<br />
                <span className="bg-gradient-to-r from-brand-400 to-turmeric-300 bg-clip-text text-transparent">10% Off Gift Hampers</span>
              </h3>
              <p className="text-white/30 text-sm mt-4">
                Use code{" "}
                <strong className="text-brand-400 bg-brand-500/8 border border-brand-500/20 px-2.5 py-1 rounded-lg font-mono text-xs">FESTIVE10</strong>{" "}
                at checkout
              </p>
            </div>
            <Link href="/products?category=gift-boxes" className="shrink-0 group inline-flex items-center gap-2.5 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white font-semibold text-sm px-8 py-4 rounded-full shadow-[0_4px_30px_rgba(212,132,58,0.35)] hover:shadow-[0_8px_40px_rgba(212,132,58,0.5)] transition-all duration-300 hover:-translate-y-0.5">
              Shop Gift Boxes
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
function StructuredData() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Magadh Recipe",
    alternateName: "Magadh Recipe — माँ के हाथ का स्वाद",
    description: "Premium handcrafted pickles, achars, masalas and regional food products born from a mother's kitchen in Bihar. No preservatives, FSSAI certified, 50,000+ happy families.",
    url: process.env.NEXTAUTH_URL,
    logo: `${process.env.NEXTAUTH_URL}/images/brand/logo.png`,
    image: `${process.env.NEXTAUTH_URL}/images/og-image.jpg`,
    priceRange: "₹₹",
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
      "https://twitter.com/magadhrecipe",
      "https://youtube.com/@magadhrecipe",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "12400",
      bestRating: "5",
      worstRating: "1",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Magadh Recipe Products",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Pickles & Achars" },
        { "@type": "OfferCatalog", name: "Masalas & Spices" },
        { "@type": "OfferCatalog", name: "Combo Packs" },
        { "@type": "OfferCatalog", name: "Gift Hampers" },
      ],
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: process.env.NEXTAUTH_URL },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
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
        href="/products?isFeatured=true"
        products={featuredProducts}
      />

      {/* Festive Banner */}
      <FestiveBanner />

      {/* Bestsellers */}
      <ProductSection
        title="Bestsellers"
        subtitle="Customer Favourites"
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
