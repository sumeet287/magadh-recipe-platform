"use client";

import { useEffect, useState } from "react";
import { TESTIMONIALS } from "@/lib/constants";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export function Testimonials() {
  const ref = useScrollReveal<HTMLElement>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((c) => (c + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: "left" | "right") => {
    setActive((c) => dir === "right" ? (c + 1) % TESTIMONIALS.length : (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const t = TESTIMONIALS[active];

  return (
    <section
      ref={ref}
                  className="relative overflow-hidden py-16 md:py-20"
      style={{ background: "linear-gradient(145deg, #2a1208 0%, #1a0c06 40%, #120804 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />
      <div className="absolute pointer-events-none" style={{ width: 600, height: 300, background: "radial-gradient(circle, rgba(212,132,58,0.06) 0%, transparent 70%)", top: "10%", left: "30%", filter: "blur(100px)" }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16">
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-10 items-end mb-16">
          <div>
            <p className="fade-up section-label text-brand-400/50 mb-5" data-reveal>Customer Stories</p>
            <h2 className="fade-up font-serif text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08]" data-reveal data-delay="1">
              Loved by <span className="bg-gradient-to-r from-brand-400 to-turmeric-300 bg-clip-text text-transparent">50,000+</span> Families
            </h2>
          </div>
          <div className="lg:text-right" data-reveal data-delay="2">
            <div className="fade-up inline-flex flex-col items-start lg:items-end gap-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-5 h-5 fill-turmeric-400 text-turmeric-400" />)}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-7xl text-white leading-none">4.9</span>
                <span className="text-white/20 text-xl font-serif">/ 5</span>
              </div>
              <p className="text-white/25 text-sm">12,400+ verified reviews</p>
            </div>
          </div>
        </div>

        {/* Main testimonial */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div
            key={active}
            className="relative rounded-[2rem] p-8 md:p-12 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Quote className="w-12 h-12 text-brand-400/10 mb-8" />

            <div className="flex gap-1 mb-6">
              {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-turmeric-400 text-turmeric-400" />)}
            </div>

            <p className="font-serif text-xl md:text-2xl lg:text-3xl text-white/80 leading-[1.4] mb-10 max-w-3xl">
              &ldquo;{t.text}&rdquo;
            </p>

            <div className="inline-flex items-center gap-2 bg-brand-500/8 border border-brand-400/15 text-brand-300/70 text-xs font-semibold px-4 py-2 rounded-full mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              {t.product}
            </div>

            <div className="flex items-center gap-4 pt-8 border-t border-white/[0.04]">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg">
                {t.name[0]}
              </div>
              <div>
                <p className="text-white font-bold">{t.name}</p>
                <p className="text-white/30 text-sm">{t.location}</p>
              </div>
              <span className="ml-auto text-[10px] font-bold bg-emerald-500/8 text-emerald-400/80 px-3 py-1.5 rounded-full border border-emerald-500/15">
                Verified Buyer
              </span>
            </div>

            {/* Nav */}
            <div className="flex items-center justify-center gap-3 mt-10">
              <button onClick={() => go("left")} className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/70 hover:border-white/[0.12] transition-all" aria-label="Previous">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => go("right")} className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/70 hover:border-white/[0.12] transition-all" aria-label="Next">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex gap-2 ml-3">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)} className={cn("rounded-full transition-all duration-500", i === active ? "w-8 h-1.5 bg-brand-400" : "w-1.5 h-1.5 bg-white/15 hover:bg-white/30")} aria-label={`Testimonial ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Side list */}
          <div className="hidden lg:flex flex-col gap-4">
            {TESTIMONIALS.filter((_, i) => i !== active).slice(0, 3).map((tt) => (
              <button
                key={tt.name}
                onClick={() => setActive(TESTIMONIALS.indexOf(tt))}
                className="text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: tt.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-turmeric-400/60 text-turmeric-400/60" />)}
                </div>
                <p className="text-white/40 text-sm leading-relaxed line-clamp-2 mb-3 group-hover:text-white/50 transition-colors">
                  &ldquo;{tt.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 text-xs font-bold bg-gradient-to-br from-brand-500/50 to-brand-700/50">
                    {tt.name[0]}
                  </div>
                  <span className="text-white/30 text-xs">{tt.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
