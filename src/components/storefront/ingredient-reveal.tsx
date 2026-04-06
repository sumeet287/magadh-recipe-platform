"use client";

import { useEffect, useRef } from "react";

const INGREDIENTS = [
  { name: "Raw Mango",       hindi: "कच्चा आम",     note: "Handpicked from Bihar orchards",     color: "#4a7c1f", bg: "rgba(74,124,31,0.12)"  },
  { name: "Mustard Oil",     hindi: "सरसों का तेल", note: "Cold-pressed, kachi ghani",           color: "#c9a227", bg: "rgba(201,162,39,0.12)" },
  { name: "Kashmiri Red Chilli", hindi: "लाल मिर्च", note: "Sun-dried, smoky depth",             color: "#c0392b", bg: "rgba(192,57,43,0.12)"  },
  { name: "Turmeric",        hindi: "हल्दी",        note: "Organic, hand-ground",               color: "#D4AC0D", bg: "rgba(212,172,13,0.12)" },
  { name: "Fenugreek",       hindi: "मेथी",         note: "Bitter undertone, traditional",       color: "#8B6914", bg: "rgba(139,105,20,0.12)" },
  { name: "Asafoetida",      hindi: "हींग",         note: "Pure resin, imported grade",          color: "#b8860b", bg: "rgba(184,134,11,0.12)" },
  { name: "Black Salt",      hindi: "काला नमक",     note: "Mineral-rich, digestive",             color: "#4a3728", bg: "rgba(74,55,40,0.12)"  },
  { name: "Nigella Seeds",   hindi: "कलौंजी",       note: "Cold-pressed aroma",                  color: "#1a1a2e", bg: "rgba(80,60,40,0.12)"  },
];

const GLYPHS: Record<string, string> = {
  "Raw Mango":          "◑",
  "Mustard Oil":        "◎",
  "Kashmiri Red Chilli":"◆",
  "Turmeric":           "◇",
  "Fenugreek":          "○",
  "Asafoetida":         "◈",
  "Black Salt":         "▣",
  "Nigella Seeds":      "◉",
};

function IngredientCard({ item }: { item: typeof INGREDIENTS[0] }) {
  return (
    <div
      className="ingredient-card relative flex-shrink-0 w-52 rounded-3xl p-6 cursor-default select-none"
      style={{
        background: `radial-gradient(ellipse at 30% 30%, ${item.bg}, rgba(15,8,5,0.55) 70%)`,
        border: `1px solid ${item.color}22`,
      }}
    >
      {/* Glyph icon */}
      <div
        className="text-5xl mb-4 leading-none"
        style={{ color: item.color, opacity: 0.8, fontFamily: "Georgia, serif" }}
        aria-hidden
      >
        {GLYPHS[item.name]}
      </div>
      {/* Name */}
      <h3 className="font-serif font-bold text-white text-lg leading-tight mb-0.5">{item.name}</h3>
      {/* Hindi */}
      <p className="text-sm mb-3" style={{ color: item.color, opacity: 0.85 }}>{item.hindi}</p>
      {/* Divider */}
      <div className="h-px mb-3" style={{ background: `linear-gradient(90deg, ${item.color}55, transparent)` }} />
      {/* Note */}
      <p className="text-white/45 text-xs leading-relaxed">{item.note}</p>
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${item.color}20, transparent 70%)` }} />
    </div>
  );
}

export function IngredientReveal() {
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Duplicate for infinite scroll
  const allItems = [...INGREDIENTS, ...INGREDIENTS];

  return (
    <section
      className="py-20 md:py-28 overflow-hidden relative"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1e0c05 0%, #0a0402 55%, #0f0602 100%)" }}
    >
      {/* Top divider */}
      <div className="divider-luxury mb-20" />

      {/* Section header */}
      <div ref={titleRef} className="reveal-up container mx-auto max-w-7xl px-6 lg:px-12 mb-14 text-center">
        <p className="text-brand-500/70 text-[10px] font-bold uppercase tracking-[0.35em] mb-4">
          What Goes In
        </p>
        <h2 className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
          Pure{" "}
          <span className="shimmer-text">Ingredients</span>
          , Nothing Else
        </h2>
        <p className="text-white/35 max-w-md mx-auto text-base leading-relaxed">
          Every jar carries generations of trust. We source, we verify, we reject anything less than perfect.
        </p>
      </div>

      {/* Track 1 — left to right */}
      <div className="relative mb-5">
        <div className="flex gap-4 marquee-track w-max">
          {allItems.map((item, i) => (
            <IngredientCard key={`a-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Track 2 — right to left (reversed order) */}
      <div className="relative">
        <div className="flex gap-4 marquee-track-rev w-max">
          {[...allItems].reverse().map((item, i) => (
            <IngredientCard key={`b-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 z-10"
        style={{ background: "linear-gradient(to right, #0a0402, transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 z-10"
        style={{ background: "linear-gradient(to left, #0a0402, transparent)" }} />

      {/* Bottom divider */}
      <div className="divider-luxury mt-20" />
    </section>
  );
}
