"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const CATEGORIES = [
  { name: "Pickles", slug: "pickles", hindi: "आचार", desc: "Traditional achars slow-marinated in cold-pressed mustard oil with Maa's secret spice blends", count: "10+", image: "/images/products/lal-mirch-bharua.jpg" },
  { name: "Regional Specials", slug: "regional-specials", hindi: "विशेष", desc: "Rare and exotic pickles from Bihar's culinary traditions — Badhal, Kathal, Oal & more", count: "4+", image: "/images/products/kathal.webp" },
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
            Two curated collections. One philosophy — pure ingredients, traditional process, zero shortcuts.
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="fade-up group relative rounded-[1.5rem] overflow-hidden h-80 md:h-[420px]" data-reveal data-delay={String(i + 1)}>
              <div className="absolute inset-0 overflow-hidden">
                <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" sizes="(max-width: 768px) calc(100vw - 48px), 680px" loading="lazy" />
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
