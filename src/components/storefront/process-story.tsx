"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    num: "01",
    title: "Sourced from Farms",
    body: "Every raw mango, chilli, and spice is handpicked directly from trusted Bihar farms. No middlemen. No cold storage. Just fresh.",
    accent: "#D4843A",
    symbol: "◎",
  },
  {
    num: "02",
    title: "Sun-Dried & Sorted",
    body: "Ingredients are laid out under the Bihar sun for days. The traditional drying process concentrates flavour and ensures zero moisture.",
    accent: "#e8a43f",
    symbol: "◇",
  },
  {
    num: "03",
    title: "Hand-Ground Masalas",
    body: "Our spice blends are stone-ground by hand — the same way it was done in 1985. Machines would kill the texture and aroma.",
    accent: "#c0392b",
    symbol: "◆",
  },
  {
    num: "04",
    title: "Marinated in Mustard Oil",
    body: "Only kachi ghani cold-pressed mustard oil. The pickle rests in clay vessels for 7-21 days, absorbing every layer of spice.",
    accent: "#D4AC0D",
    symbol: "◑",
  },
  {
    num: "05",
    title: "Sealed & Shipped Fresh",
    body: "Each jar is hand-filled, vacuum-sealed, and dispatched within 48 hours of an order. Zero preservatives, maximum freshness.",
    accent: "#27ae60",
    symbol: "◉",
  },
];

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isEven = index % 2 === 1;

  return (
    <div
      ref={ref}
      className="reveal-up grid lg:grid-cols-2 gap-10 lg:gap-20 items-center"
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      {/* Number side */}
      <div className={cn("order-1", isEven ? "lg:order-2" : "lg:order-1")}>
        {/* Giant step number */}
        <div
          className="font-serif font-black leading-none mb-6 select-none"
          style={{
            fontSize: "clamp(96px, 14vw, 160px)",
            color: step.accent,
            opacity: 0.12,
            lineHeight: 0.85,
          }}
          aria-hidden
        >
          {step.num}
        </div>
        {/* Symbol */}
        <div
          className="font-serif text-4xl mb-5 leading-none"
          style={{ color: step.accent }}
          aria-hidden
        >
          {step.symbol}
        </div>
        <h3 className="font-serif text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
          {step.title}
        </h3>
        <p className="text-white/45 text-base leading-relaxed max-w-sm">{step.body}</p>
      </div>

      {/* Visual side — abstract art panel */}
      <div className={cn("order-2", isEven ? "lg:order-1" : "lg:order-2")}>
        <div
          className="relative h-56 lg:h-72 rounded-3xl overflow-hidden"
          style={{ background: `radial-gradient(ellipse at 35% 40%, ${step.accent}22 0%, rgba(15,8,5,0.9) 70%)`, border: `1px solid ${step.accent}18` }}
        >
          {/* Concentric circles */}
          {[0.85, 0.65, 0.45, 0.28].map((r, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: `${r * 100}%`,
                height: `${r * 100}%`,
                border: `1px solid ${step.accent}${Math.round((0.25 - i * 0.05) * 255).toString(16).padStart(2,"0")}`,
              }}
            />
          ))}
          {/* Center glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full"
            style={{
              background: `radial-gradient(circle, ${step.accent}55, transparent 70%)`,
              boxShadow: `0 0 40px ${step.accent}44`,
            }}
          />
          {/* Step glyph center */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold text-4xl z-10"
            style={{ color: step.accent }}
            aria-hidden
          >
            {step.symbol}
          </div>
          {/* Step number watermark */}
          <div
            className="absolute bottom-4 right-5 font-serif font-black text-[80px] leading-none select-none"
            style={{ color: step.accent, opacity: 0.07 }}
            aria-hidden
          >
            {step.num}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProcessStory() {
  const headRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className="py-24 md:py-36 relative overflow-hidden"
      style={{ background: "#0a0402" }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #D4843A, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #c0392b, transparent)" }} />

      <div className="container mx-auto max-w-6xl px-6 lg:px-12">
        {/* Header */}
        <div ref={headRef} className="reveal-up text-center mb-24 lg:mb-32">
          <p className="text-brand-500/65 text-[10px] font-bold uppercase tracking-[0.35em] mb-5">
            Our Process
          </p>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-white leading-[1.05] mb-6">
            From{" "}
            <span className="shimmer-text">Earth</span>
            {" "}to Your Table
          </h2>
          <p className="text-white/35 max-w-lg mx-auto text-base leading-relaxed">
            No machines. No shortcuts. Five deliberate steps, unchanged since our grandfather&apos;s kitchen.
          </p>
          {/* Decorative line */}
          <div className="mx-auto mt-8 w-px h-16 process-line" aria-hidden />
        </div>

        {/* Steps */}
        <div className="relative space-y-24 lg:space-y-32">
          {/* Vertical timeline line (desktop) */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px process-line" aria-hidden />

          {STEPS.map((step, i) => (
            <div key={step.num} className="relative">
              {/* Timeline dot (desktop) */}
              <div
                className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-8 w-3 h-3 rounded-full z-10 ring-4 ring-[#0a0402]"
                style={{ background: step.accent, boxShadow: `0 0 16px ${step.accent}88` }}
                aria-hidden
              />
              <StepCard step={step} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
