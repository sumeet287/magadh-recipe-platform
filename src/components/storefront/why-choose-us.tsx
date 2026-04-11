"use client";

import Image from "next/image";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { BRAND_STORY } from "@/lib/constants";
import { Star } from "lucide-react";

const FEATURES = [
  { num: "01", title: "Maa ki Recipe", body: "Every jar carries a mother's secret recipe — lovingly perfected over three decades in the Magadh kitchens of Bihar." },
  { num: "02", title: "Handpicked Ingredients", body: "Only kachi ghani mustard oil, farm-fresh chilies, and stone-ground spices sourced directly from Bihar's fields." },
  { num: "03", title: "Zero Preservatives", body: "No artificial colors, no chemicals, no shortcuts. Pure, honest, natural goodness — exactly like homemade should be." },
  { num: "04", title: "Crafted with Love", body: "Each batch is prepared by skilled home cooks who pour their heart and soul into every jar they seal." },
  { num: "05", title: "Gift-Worthy Packaging", body: "Beautifully packaged in premium glass jars — perfect for gifting on festivals, weddings, and special occasions." },
  { num: "06", title: "Farm-Fresh Delivery", body: "Prepared fresh on order and dispatched within 48 hours. Delivered pan-India with care in 3–7 business days." },
];

export function WhyChooseUs() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-20 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1a0c06 0%, #120804 50%, #0d0603 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(212,132,58,0.04) 0%, transparent 70%)", top: "20%", right: "10%", filter: "blur(80px)" }} />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="mb-20 max-w-xl">
          <p className="fade-up section-label text-brand-400/50 mb-4" data-reveal>Why Magadh Recipe</p>
          <h2 className="fade-up font-serif text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] mb-5" data-reveal data-delay="1">
            The <span className="shimmer-text">Magadh</span> Difference
          </h2>
          <div className="line-grow h-[2px] w-16 rounded-full bg-gradient-to-r from-brand-400 to-brand-200" data-reveal data-delay="2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 lg:gap-y-16">
          {FEATURES.map((f, i) => (
            <div key={f.num} className="fade-up group relative" data-reveal data-delay={String(i + 1)}>
              <span className="block font-serif font-bold text-5xl leading-none mb-4 select-none transition-colors duration-500 group-hover:text-brand-400/30" style={{ color: "rgba(212,132,58,0.2)" }}>
                {f.num}
              </span>
              <h3 className="font-serif font-bold text-white/90 text-xl mb-3 leading-tight group-hover:text-brand-400 transition-colors duration-300">
                {f.title}
              </h3>
              <p className="text-white/30 text-sm leading-relaxed">{f.body}</p>
              <div className="mt-5 h-px bg-white/[0.03] group-hover:bg-brand-400/15 transition-colors duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandStory() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-16 md:py-20"
      style={{ background: "linear-gradient(145deg, #1a0c06 0%, #0d0603 40%, #120804 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[20vw] font-serif font-bold text-white/[0.015] select-none whitespace-nowrap">माँ</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          <div className="fade-up order-2 lg:order-1 relative" data-reveal>
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
              <Image src="/images/brand/poster.webp" alt="Magadh Recipe — Maa ke Haath ka Swaad" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0603]/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3">
                {BRAND_STORY.stats.slice(0, 2).map((stat) => (
                  <div key={stat.label} className="backdrop-blur-xl rounded-2xl p-4 text-center" style={{ background: "rgba(13,6,3,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-2xl font-bold text-brand-300 font-serif leading-none">{stat.value}</div>
                    <div className="text-[10px] text-white/35 mt-1.5 uppercase tracking-[0.15em]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="fade-up section-label text-brand-400/50 mb-5" data-reveal>Our Story</p>
            <h2 className="fade-up font-serif text-3xl md:text-5xl font-bold text-white leading-[1.08] mb-5" data-reveal data-delay="1">{BRAND_STORY.title}</h2>
            <p className="fade-up text-brand-300/60 font-serif text-lg italic mb-10 leading-relaxed" data-reveal data-delay="2">{BRAND_STORY.subtitle}</p>
            <div className="space-y-5 mb-12">
              {BRAND_STORY.paragraphs.map((p, i) => (
                <p key={i} className="fade-up text-white/30 text-sm leading-[1.8]" data-reveal data-delay={String(i + 3)}>{p}</p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4" data-reveal>
              {BRAND_STORY.stats.slice(2).map((stat, i) => (
                <div key={stat.label} className="fade-up rounded-2xl p-5" data-delay={String(i + 7)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    {stat.value === "5★" && <Star className="w-4 h-4 fill-turmeric-400 text-turmeric-400" />}
                    <span className="text-2xl font-bold text-brand-400 font-serif">{stat.value}</span>
                  </div>
                  <div className="text-[11px] text-white/25 uppercase tracking-[0.15em]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
