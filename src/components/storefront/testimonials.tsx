"use client";

import { useEffect, useRef, useState } from "react";
import { TESTIMONIALS } from "@/lib/constants";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Testimonials() {
  const headRef  = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<"left"|"right">("right");

  useEffect(() => {
    const el = headRef.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const go = (dir: "left"|"right") => {
    setDirection(dir);
    setActive((curr) =>
      dir === "right"
        ? (curr + 1) % TESTIMONIALS.length
        : (curr - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
    );
  };

  const t = TESTIMONIALS[active];

  return (
    <section
      className="relative overflow-hidden py-24 md:py-36"
      style={{ background: "radial-gradient(ellipse at 50% 100%, #1e0a04 0%, #0a0402 60%, #0f0602 100%)" }}
    >
      {/* Film grain */}
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none z-[1]" aria-hidden />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[140px] pointer-events-none opacity-[0.08]"
        style={{ background: "radial-gradient(ellipse, #D4843A, transparent)" }} />

      {/* Top divider */}
      <div className="divider-luxury mb-24" />

      <div className="relative z-10 container mx-auto max-w-7xl px-6 lg:px-12">

        {/* Header */}
        <div ref={headRef} className="reveal-up grid lg:grid-cols-2 gap-12 items-start mb-20">
          <div>
            <p className="text-brand-500/65 text-[10px] font-bold uppercase tracking-[0.35em] mb-5">
              Customer Stories
            </p>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight">
              Real People,{" "}
              <br />
              <span className="shimmer-text">Real Love</span>
            </h2>
          </div>
          <div className="lg:text-right">
            {/* Big rating */}
            <div className="inline-flex flex-col items-start lg:items-end gap-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-turmeric-400 text-turmeric-400" />
                ))}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-7xl text-white leading-none">4.9</span>
                <span className="text-white/30 text-xl">/ 5</span>
              </div>
              <p className="text-white/30 text-sm">12,400+ verified reviews</p>
            </div>
          </div>
        </div>

        {/* Testimonials layout: featured large + side list */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">

          {/* Featured quote */}
          <div
            key={active}
            className="relative rounded-3xl p-10 md:p-12 overflow-hidden"
            style={{
              background: "radial-gradient(ellipse at 20% 30%, rgba(212,132,58,0.07) 0%, rgba(15,8,5,0.7) 70%)",
              border: "1px solid rgba(212,132,58,0.12)",
            }}
          >
            {/* Giant quote mark */}
            <div
              className="absolute -top-4 -left-2 font-serif font-black leading-none select-none text-brand-400/10"
              style={{ fontSize: "clamp(160px, 20vw, 240px)" }}
              aria-hidden
            >
              &ldquo;
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-8 relative z-10">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-turmeric-400 text-turmeric-400" />
              ))}
            </div>

            {/* Quote text */}
            <p className="relative z-10 font-serif text-xl md:text-2xl lg:text-3xl text-white/85 leading-relaxed mb-10 max-w-2xl">
              {t.text}
            </p>

            {/* Product tag */}
            <div className="inline-flex items-center gap-2 bg-brand-500/12 border border-brand-400/20 text-brand-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              {t.product}
            </div>

            {/* Author */}
            <div className="flex items-center gap-4 pt-8 border-t border-white/8 relative z-10">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xl"
                style={{ background: "linear-gradient(135deg, #D4843A, #c0392b)" }}
              >
                {t.name[0]}
              </div>
              <div>
                <p className="text-white font-bold text-base">{t.name}</p>
                <p className="text-white/35 text-sm">{t.location}</p>
              </div>
              <span className="ml-auto text-[11px] font-semibold bg-green-500/15 text-green-400 px-3 py-1.5 rounded-full">
                ✓ Verified
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-8 relative z-10">
              <button
                onClick={() => go("left")}
                className="w-10 h-10 rounded-full border border-white/12 flex items-center justify-center text-white/50 hover:text-white hover:border-brand-400/50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => go("right")}
                className="w-10 h-10 rounded-full border border-white/12 flex items-center justify-center text-white/50 hover:text-white hover:border-brand-400/50 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Progress dots */}
              <div className="flex gap-1.5 ml-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === active ? "w-6 h-1.5 bg-brand-400" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                    )}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Side list — other testimonials */}
          <div className="hidden lg:flex flex-col gap-4">
            {TESTIMONIALS.filter((_, i) => i !== active).slice(0, 3).map((tt, i) => (
              <button
                key={tt.name}
                onClick={() => { setDirection("right"); setActive(TESTIMONIALS.indexOf(tt)); }}
                className="text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex gap-0.5 mb-2.5">
                  {Array.from({ length: tt.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-turmeric-400 text-turmeric-400" />
                  ))}
                </div>
                <p className="text-white/55 text-sm leading-relaxed line-clamp-3 mb-3">{tt.text}</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #D4843A, #c0392b)" }}
                  >
                    {tt.name[0]}
                  </div>
                  <span className="text-white/40 text-xs font-medium">{tt.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="divider-luxury mt-24" />
    </section>
  );
}

