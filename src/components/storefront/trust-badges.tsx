"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { FlaskConical, Leaf, Package, Truck, RotateCcw, Award } from "lucide-react";

const BADGES = [
  { Icon: FlaskConical, label: "100% Homemade" },
  { Icon: Leaf, label: "No Preservatives" },
  { Icon: Package, label: "Secure Packaging" },
  { Icon: Truck, label: "Pan-India Delivery" },
  { Icon: RotateCcw, label: "Easy Returns" },
  { Icon: Award, label: "FSSAI Certified" },
];

export function TrustBadges() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      data-reveal
      className="fade-up relative py-5 overflow-hidden"
      style={{ background: "#120804", borderTop: "1px solid rgba(212,132,58,0.06)", borderBottom: "1px solid rgba(212,132,58,0.06)" }}
    >
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-center gap-0">
        {BADGES.map((b, i) => (
          <div key={b.label} className="flex items-center">
            {i > 0 && <div className="w-px h-4 bg-white/[0.06]" />}
            <div className="flex items-center gap-2.5 px-6">
              <b.Icon className="w-3.5 h-3.5 text-brand-400/50" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold text-white/30 tracking-wide whitespace-nowrap">{b.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Mobile scroll */}
      <div className="md:hidden relative">
        <div className="trust-strip-track flex w-max">
          {[...BADGES, ...BADGES].map((b, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2 px-5">
                <b.Icon className="w-3.5 h-3.5 text-brand-400/50" strokeWidth={1.5} />
                <span className="text-[11px] font-semibold text-white/30 tracking-wide whitespace-nowrap">{b.label}</span>
              </div>
              <div className="w-px h-3 bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
