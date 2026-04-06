"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

const CATEGORIES = [
  {
    num: "01",
    name: "Pickles",
    slug: "pickles",
    hindi: "आचार",
    desc: "Traditional achars slow-marinated in pure cold-pressed mustard oil",
    count: "12+ varieties",
  },
  {
    num: "02",
    name: "Masalas & Spices",
    slug: "masalas",
    hindi: "मसाले",
    desc: "Hand-ground spice blends carrying the soul of Bihar's kitchens",
    count: "8+ blends",
  },
  {
    num: "03",
    name: "Combo Packs",
    slug: "combo-packs",
    hindi: "कॉम्बो",
    desc: "Curated multi-product packs for maximum value and variety",
    count: "6+ combos",
  },
  {
    num: "04",
    name: "Gift Boxes",
    slug: "gift-boxes",
    hindi: "उपहार",
    desc: "Premium hampers for Diwali, weddings & every celebration",
    count: "5+ hampers",
  },
  {
    num: "05",
    name: "Regional Specials",
    slug: "regional-specials",
    hindi: "विशेष",
    desc: "Rare regional recipes from Bihar's rich culinary traditions",
    count: "4+ exclusives",
  },
];

export function CategoriesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll<HTMLElement>(".cat-reveal");
    if (!els) return;
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("revealed");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 70% 30%, #1a0b03 0%, #0e0602 55%, #080401 100%)",
      }}
    >
      {/* Top divider */}
      <div className="divider-luxury" />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none right-0 top-1/3 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,132,58,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden
      />

      <div className="relative container mx-auto max-w-7xl px-6 lg:px-12 pt-16 pb-4">
        <div className="grid lg:grid-cols-[360px_1fr] gap-16 lg:gap-24 items-start">

          {/* Left editorial column — sticky */}
          <div className="cat-reveal reveal-up lg:sticky lg:top-32">
            <p className="luxury-num mb-5">Collections</p>
            <h2 className="font-serif font-bold leading-[0.9] mb-8">
              <span className="block text-white/18 text-6xl md:text-8xl">Shop</span>
              <span className="block shimmer-text text-6xl md:text-8xl">by</span>
              <span className="block text-white text-glow-white text-6xl md:text-8xl">Category</span>
            </h2>
            <p className="text-white/30 text-sm leading-relaxed max-w-[240px] mb-10">
              Five craft collections. One philosophy — pure ingredients, traditional process, zero shortcuts.
            </p>
            <div className="flex items-center gap-8 mb-10">
              <div>
                <div className="font-serif text-3xl font-bold text-brand-400 text-glow-gold tabular-nums">5</div>
                <div className="text-[10px] uppercase tracking-widest text-white/28 font-semibold mt-1">Collections</div>
              </div>
              <div className="w-px h-10 bg-white/8" />
              <div>
                <div className="font-serif text-3xl font-bold text-brand-400 text-glow-gold tabular-nums">35+</div>
                <div className="text-[10px] uppercase tracking-widest text-white/28 font-semibold mt-1">Products</div>
              </div>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-brand-400/28 text-brand-300 hover:text-brand-200 hover:border-brand-300/55 text-xs font-bold uppercase tracking-[0.18em] px-6 py-3 rounded-full transition-all duration-300 hover:bg-brand-500/8 group"
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right: numbered category list */}
          <div className="border-t border-white/6">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="cat-reveal reveal-up group relative flex items-center gap-4 sm:gap-6 py-7 border-b border-white/6 overflow-hidden transition-[padding,border-color] duration-500 hover:pl-3 hover:border-white/12"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                {/* Hover sweep background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(212,132,58,0.06) 0%, transparent 55%)",
                  }}
                />
                {/* Animated left accent bar */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-3/4 transition-all duration-500 rounded-full"
                  style={{ background: "rgba(212,132,58,0.65)" }}
                />

                {/* Number */}
                <span className="luxury-num shrink-0 w-7 group-hover:text-brand-400/80 transition-colors duration-300">
                  {cat.num}
                </span>

                {/* Hindi script badge */}
                <span
                  className="font-serif text-xl sm:text-2xl shrink-0 w-10 text-center opacity-20 group-hover:opacity-50 transition-opacity duration-300"
                  style={{ color: "#e8a951" }}
                >
                  {cat.hindi}
                </span>

                {/* Name + description */}
                <div className="flex-1 min-w-0 relative z-10">
                  <h3 className="font-serif font-bold text-white text-lg sm:text-xl md:text-2xl leading-none mb-1.5 group-hover:text-brand-200 transition-colors duration-300">
                    {cat.name}
                  </h3>
                  <p className="text-white/25 text-xs sm:text-sm group-hover:text-white/45 transition-colors duration-300 truncate">
                    {cat.desc}
                  </p>
                </div>

                {/* Count + arrow */}
                <div className="shrink-0 flex items-center gap-3 sm:gap-5 relative z-10">
                  <span className="hidden sm:block text-[11px] font-semibold text-white/15 group-hover:text-brand-400/55 transition-colors duration-300 tracking-wider whitespace-nowrap">
                    {cat.count}
                  </span>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/10 flex items-center justify-center group-hover:border-brand-400/50 group-hover:bg-brand-500/12 transition-all duration-300">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/25 group-hover:text-brand-400 transition-colors duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom divider */}
      <div className="divider-luxury mt-16" />
    </section>
  );
}
