"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const INGREDIENTS = [
  { name: "Raw Mango", hindi: "कच्चा आम", note: "Handpicked from Bihar orchards", color: "#4a7c1f" },
  { name: "Mustard Oil", hindi: "सरसों का तेल", note: "Cold-pressed, kachi ghani", color: "#c9a227" },
  { name: "Kashmiri Chilli", hindi: "लाल मिर्च", note: "Sun-dried, smoky depth", color: "#c0392b" },
  { name: "Turmeric", hindi: "हल्दी", note: "Organic, hand-ground", color: "#D4AC0D" },
  { name: "Fenugreek", hindi: "मेथी", note: "Bitter undertone, traditional", color: "#8B6914" },
  { name: "Asafoetida", hindi: "हींग", note: "Pure resin, imported grade", color: "#b8860b" },
  { name: "Black Salt", hindi: "काला नमक", note: "Mineral-rich, digestive", color: "#6b5b4f" },
  { name: "Nigella Seeds", hindi: "कलौंजी", note: "Cold-pressed aroma", color: "#8B6914" },
];

function Card({ item }: { item: (typeof INGREDIENTS)[0] }) {
  return (
    <div
      className="flex-shrink-0 w-44 rounded-2xl p-5 select-none transition-all duration-300 hover:-translate-y-1"
      style={{ background: `${item.color}0A`, border: `1px solid ${item.color}15` }}
    >
      <div className="text-2xl mb-2 leading-none font-serif font-bold" style={{ color: item.color, opacity: 0.6 }}>{item.hindi}</div>
      <h3 className="font-serif font-bold text-white/80 text-sm leading-tight mb-1">{item.name}</h3>
      <div className="h-px mb-2 w-6" style={{ background: `linear-gradient(90deg, ${item.color}44, transparent)` }} />
      <p className="text-white/25 text-[11px] leading-relaxed">{item.note}</p>
    </div>
  );
}

export function IngredientReveal() {
  const ref = useScrollReveal<HTMLElement>();
  const items = [...INGREDIENTS, ...INGREDIENTS];

  return (
    <section
      ref={ref}
      className="py-14 md:py-18 overflow-hidden relative"
      style={{ background: "linear-gradient(180deg, #120804 0%, #0d0603 50%, #1a0c06 100%)" }}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/10 to-transparent" />

      <div className="fade-up container mx-auto max-w-7xl px-4 sm:px-6 mb-12 text-center" data-reveal>
        <p className="section-label text-brand-400/50 mb-4">What Goes In</p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
          Pure <span className="shimmer-text">Ingredients</span>
        </h2>
        <p className="text-white/25 max-w-md mx-auto text-sm leading-relaxed">
          Maa picks every ingredient herself. What goes in the jar must pass the test of three generations.
        </p>
      </div>

      <div className="relative mb-4">
        <div className="flex gap-4 marquee-track w-max">{items.map((item, i) => <Card key={`a-${i}`} item={item} />)}</div>
      </div>
      <div className="relative">
        <div className="flex gap-4 marquee-track-rev w-max">{[...items].reverse().map((item, i) => <Card key={`b-${i}`} item={item} />)}</div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10" style={{ background: "linear-gradient(to right, #0d0603, transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10" style={{ background: "linear-gradient(to left, #0d0603, transparent)" }} />

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/10 to-transparent" />
    </section>
  );
}
