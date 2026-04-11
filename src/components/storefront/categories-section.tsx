"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const CATEGORIES = [
  { name: "Pickles", slug: "pickles", hindi: "आचार", desc: "Traditional achars slow-marinated in cold-pressed mustard oil", count: "12+", image: "/images/products/lal-mirch-bharua.png" },
  { name: "Masalas & Spices", slug: "masalas-spices", hindi: "मसाले", desc: "Hand-ground spice blends from Bihar's kitchens", count: "8+", image: "/images/products/garlic.webp" },
  { name: "Combo Packs", slug: "combo-packs", hindi: "कॉम्बो", desc: "Curated multi-product packs for maximum value", count: "6+", image: "/images/products/mixed-vegetable.webp" },
  { name: "Gift Boxes", slug: "gift-boxes", hindi: "उपहार", desc: "Premium hampers for Diwali, weddings & celebrations", count: "5+", image: "/images/products/khatta-meetha-lemon.webp" },
  { name: "Regional Specials", slug: "regional-specials", hindi: "विशेष", desc: "Rare recipes from Bihar's culinary traditions", count: "4+", image: "/images/products/kathal.webp" },
];

export function CategoriesSection() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-20 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0d0603 0%, #1a0c06 50%, #120804 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <p className="fade-up section-label text-brand-400/50 mb-4" data-reveal>Collections</p>
          <h2 className="fade-up font-serif text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] mb-5" data-reveal data-delay="1">
            Shop by <span className="shimmer-text">Category</span>
          </h2>
          <div className="line-grow h-[2px] w-16 rounded-full bg-gradient-to-r from-brand-400 to-brand-200 mb-5" data-reveal data-delay="2" />
          <p className="fade-up text-white/30 text-base leading-relaxed" data-reveal data-delay="3">
            Five handcrafted collections. One philosophy — pure ingredients, traditional process, zero shortcuts.
          </p>
        </div>

        {/* 2 large cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {CATEGORIES.slice(0, 2).map((cat, i) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="fade-up group relative rounded-[1.5rem] overflow-hidden h-80 md:h-[420px]" data-reveal data-delay={String(i + 1)}>
              <div className="absolute inset-0 overflow-hidden">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0603] via-[#0d0603]/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
                <span className="font-serif text-3xl text-white/10 mb-2">{cat.hindi}</span>
                <h3 className="font-serif font-bold text-white text-3xl md:text-4xl leading-tight mb-3 group-hover:text-brand-200 transition-colors duration-500">{cat.name}</h3>
                <p className="text-white/30 text-sm leading-relaxed max-w-sm mb-6 hidden sm:block">{cat.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-brand-400/40 text-xs font-bold uppercase tracking-[0.2em]">{cat.count} varieties</span>
                  <div className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center text-white/30 group-hover:text-white group-hover:border-brand-400/30 group-hover:bg-brand-500/10 transition-all duration-500">
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 3 smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CATEGORIES.slice(2).map((cat, i) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="fade-up group relative rounded-[1.5rem] overflow-hidden h-64 sm:h-72" data-reveal data-delay={String(i + 3)}>
              <div className="absolute inset-0 overflow-hidden">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0603] via-[#0d0603]/15 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-7">
                <span className="font-serif text-xl text-white/10 mb-1">{cat.hindi}</span>
                <h3 className="font-serif font-bold text-white text-xl leading-tight mb-1 group-hover:text-brand-200 transition-colors duration-500">{cat.name}</h3>
                <span className="text-white/20 text-xs">{cat.count} varieties</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12" data-reveal>
          <Link href="/products" className="fade-up inline-flex items-center gap-2 border border-white/[0.08] hover:border-brand-400/30 text-white/40 hover:text-brand-300 font-semibold text-sm px-8 py-3.5 rounded-full transition-all duration-300 group hover:bg-white/[0.02]">
            View All Products
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
