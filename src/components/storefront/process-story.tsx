"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const STEPS = [
  { num: "01", title: "Sourced from Farms", body: "Every raw mango, chilli, and spice is handpicked directly from trusted Bihar farms. No middlemen, no cold storage — just farm-fresh goodness.", image: "/images/products/kuccha-aam.webp" },
  { num: "02", title: "Sun-Dried & Sorted", body: "Ingredients are laid out under the Bihar sun for days. Traditional sun-drying concentrates flavour and ensures zero moisture — nature's own preservation.", image: "/images/products/mango-ingredients.webp" },
  { num: "03", title: "Hand-Ground Masalas", body: "Spice blends are stone-ground by hand — the same way Maa has done it for decades. Machines would kill the texture and aroma she insists on.", image: "/images/products/garlic.webp" },
  { num: "04", title: "Marinated in Mustard Oil", body: "Only kachi ghani cold-pressed mustard oil. The pickle rests for 7–21 days in clay vessels, absorbing every layer of spice and tradition.", image: "/images/products/chilli-kuccha.webp" },
  { num: "05", title: "Sealed & Shipped Fresh", body: "Each jar is hand-filled, sealed in premium glass, and dispatched within 48 hours. Zero preservatives, maximum freshness, pure love.", image: "/images/products/lemon.webp" },
];

export function ProcessStory() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-20 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1a0c06 0%, #120804 50%, #0d0603 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(212,132,58,0.05) 0%, transparent 70%)", top: "15%", left: "5%", filter: "blur(80px)" }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16">
        {/* Header */}
        <div className="mb-20 max-w-xl">
          <p className="fade-up section-label text-brand-400/50 mb-4" data-reveal>Our Process</p>
          <h2 className="fade-up font-serif text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] mb-5" data-reveal data-delay="1">
            From Maa&apos;s Kitchen <span className="shimmer-text">to Yours</span>
          </h2>
          <div className="line-grow h-[2px] w-16 rounded-full bg-gradient-to-r from-brand-400 to-brand-200" data-reveal data-delay="2" />
        </div>

        {/* Steps */}
        <div className="space-y-14 lg:space-y-20">
          {STEPS.map((step, i) => {
            const isEven = i % 2 === 1;
            return (
              <div
                key={step.num}
                className="fade-up grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
                data-reveal
                data-delay={String((i % 3) + 1)}
              >
                {/* Image */}
                <div className={cn("order-1", isEven ? "lg:order-2" : "lg:order-1")}>
                  <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] group">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0603]/50 via-transparent to-transparent" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)" }} />
                    <div className="absolute top-5 left-5 backdrop-blur-xl rounded-xl px-4 py-2" style={{ background: "rgba(13,6,3,0.6)", border: "1px solid rgba(212,132,58,0.1)" }}>
                      <span className="text-brand-400 font-serif font-bold text-sm">Step {step.num}</span>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className={cn("order-2", isEven ? "lg:order-1" : "lg:order-2")}>
                  <span
                    className="block font-serif font-bold text-[6rem] sm:text-[8rem] leading-none tracking-tighter select-none mb-4"
                    style={{ color: "rgba(212,132,58,0.18)" }}
                  >
                    {step.num}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-[1.1] mb-5">
                    {step.title}
                  </h3>
                  <p className="text-white/35 text-base leading-relaxed max-w-md">
                    {step.body}
                  </p>
                  <div className="mt-6 h-px bg-white/[0.04] max-w-xs" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
