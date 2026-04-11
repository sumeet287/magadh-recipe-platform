"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Counter({ value, label, run }: { value: string; label: string; run: boolean }) {
  const [display, setDisplay] = useState("0");
  const ran = useRef(false);
  useEffect(() => {
    if (!run || ran.current) return;
    ran.current = true;
    if (!/^\d/.test(value)) { setDisplay(value); return; }
    const num = parseInt(value.replace(/\D/g, ""), 10);
    const suffix = value.replace(/^\d+/, "");
    const dur = 1600;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - (1 - p) ** 4;
      const cur = Math.round(ease * num);
      setDisplay((num >= 1000 ? `${Math.round(cur / 1000)}K` : `${cur}`) + suffix);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [run, value]);
  return (
    <div className="text-center sm:text-left">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-400 font-serif tabular-nums leading-none mb-2" style={{ textShadow: "0 0 40px rgba(212,132,58,0.3)" }}>{display}</div>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/35 font-medium">{label}</div>
    </div>
  );
}

const SLIDES = [
  {
    id: 1,
    tag: "Handcrafted with Love",
    line1: "Maa ke Haath ka",
    accent: "Swaad",
    sub: "A mother's love, sealed in every jar. Premium handcrafted pickles from Bihar — no preservatives, no shortcuts, no compromise.",
    cta: { label: "Explore Collection", href: "/products" },
    cta2: { label: "Our Story", href: "/about" },
    img: "/images/products/lal-mirch-bharua.png",
    stats: [{ value: "50K+", label: "Happy Families" }, { value: "15+", label: "Pickles" }, { value: "0%", label: "Preservatives" }],
  },
  {
    id: 2,
    tag: "Bihar's Finest",
    line1: "Taste the Legacy of",
    accent: "Magadh",
    sub: "From rare Badhal pickle to fiery Lal Mirch Bharua — every jar is a tribute to Bihar's rich culinary heritage. Handcrafted, sun-dried, unforgettable.",
    cta: { label: "Shop Bestsellers", href: "/products?isBestseller=true" },
    cta2: { label: "New Arrivals", href: "/products?isNewArrival=true" },
    img: "/images/products/green-chilli.webp",
    stats: [{ value: "5★", label: "Avg Rating" }, { value: "15+", label: "Varieties" }, { value: "100%", label: "Natural" }],
  },
];

export function HeroBanner() {
  const [cur, setCur] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [countersOn, setCountersOn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  useEffect(() => { setTimeout(() => { setLoaded(true); setCountersOn(true); }, 200); }, []);

  const handleMouse = useCallback((e: React.MouseEvent<HTMLElement>) => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      if (imgRef.current)
        imgRef.current.style.transform = `perspective(1200px) rotateY(${nx * 8}deg) rotateX(${-ny * 5}deg) scale(1.02)`;
      if (glowRef.current) {
        const px = ((e.clientX - r.left) / r.width) * 100;
        const py = ((e.clientY - r.top) / r.height) * 100;
        glowRef.current.style.background = `radial-gradient(800px at ${px}% ${py}%, rgba(212,132,58,0.07) 0%, transparent 60%)`;
      }
    });
  }, []);

  const handleLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (imgRef.current) {
      imgRef.current.style.transition = "transform 0.8s cubic-bezier(0.22,1,0.36,1)";
      imgRef.current.style.transform = "";
      setTimeout(() => { if (imgRef.current) imgRef.current.style.transition = ""; }, 900);
    }
  }, []);

  const goTo = useCallback((i: number) => {
    if (i === cur || transitioning) return;
    setTransitioning(true);
    setCountersOn(false);
    setTimeout(() => { setCur(i); setTransitioning(false); setTimeout(() => setCountersOn(true), 400); }, 400);
  }, [cur, transitioning]);

  useEffect(() => {
    const t = setInterval(() => goTo((cur + 1) % SLIDES.length), 8000);
    return () => clearInterval(t);
  }, [cur, goTo]);

  const s = SLIDES[cur];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden lg:min-h-[100vh] flex items-end lg:items-center"
      style={{ background: "linear-gradient(145deg, #2a1208 0%, #1a0c06 35%, #120804 70%, #0d0603 100%)" }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      <div ref={glowRef} className="absolute inset-0 pointer-events-none z-[1]" />
      <div className="absolute pointer-events-none blob-1" style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(212,132,58,0.08) 0%, transparent 70%)", top: "-5%", left: "5%", filter: "blur(100px)" }} />
      <div className="absolute pointer-events-none blob-2" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(192,57,43,0.05) 0%, transparent 70%)", bottom: "5%", right: "0%", filter: "blur(80px)" }} />
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none z-[2]" aria-hidden />
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, #D4843A 0.8px, transparent 0.8px)", backgroundSize: "48px 48px" }} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16 pt-6 pb-6 sm:pt-10 sm:pb-10 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-center min-h-0 lg:min-h-[80vh]">

          {/* LEFT */}
          <div className={cn("transition-all duration-500", transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0")}>
            <div className={cn("flex items-center gap-3 mb-5 sm:mb-8 transition-all duration-700 delay-100", loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <span className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] text-brand-300/80 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-full backdrop-blur-sm">
                <Star className="w-3 h-3 fill-brand-400 text-brand-400" />{s.tag}
              </span>
            </div>

            <h1 className="font-serif mb-5 sm:mb-8">
              <span className={cn("block text-white/90 text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[1.08] tracking-tight transition-all duration-700 delay-200", loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")} style={{ textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
                {s.line1}
              </span>
              <span
                className={cn("block mt-2 text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold leading-[1.05] shimmer-text transition-all duration-700 delay-300", loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}
              >
                {s.accent}
              </span>
            </h1>

            <div className={cn("w-16 h-[2px] rounded-full mb-5 sm:mb-8 transition-all duration-700 delay-[400ms]", loaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0")} style={{ background: "linear-gradient(90deg, #D4843A, #f0c579, transparent)", transformOrigin: "left" }} />

            <p className={cn("text-white/40 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-10 max-w-[480px] transition-all duration-700 delay-500", loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              {s.sub}
            </p>

            <div className={cn("flex flex-wrap gap-4 mb-16 transition-all duration-700 delay-[600ms]", loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              <Link href={s.cta.href} className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white font-semibold text-sm px-8 py-4 rounded-full shadow-[0_4px_30px_rgba(212,132,58,0.35)] hover:shadow-[0_8px_40px_rgba(212,132,58,0.5)] transition-all duration-300 hover:-translate-y-0.5">
                {s.cta.label}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link href={s.cta2.href} className="inline-flex items-center gap-2 border border-white/[0.08] hover:border-white/[0.15] text-white/50 hover:text-white/80 font-semibold text-sm px-8 py-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.03]">
                {s.cta2.label}
              </Link>
            </div>

            <div className={cn("flex gap-8 sm:gap-12 transition-all duration-700 delay-700", loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
              {s.stats.map((st, i) => (
                <div key={st.label} className="relative">
                  {i > 0 && <div className="absolute -left-4 sm:-left-6 top-1 bottom-1 w-px bg-white/[0.06]" />}
                  <Counter value={st.value} label={st.label} run={countersOn} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className={cn("hidden lg:flex items-center justify-center relative transition-all duration-1000 delay-300", loaded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95")}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[420px] h-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(212,132,58,0.12) 0%, rgba(212,132,58,0.03) 50%, transparent 70%)", filter: "blur(40px)" }} />
            </div>

            <div ref={imgRef} className="relative will-change-transform" style={{ width: "min(460px, 92%)", transformStyle: "preserve-3d" }}>
              <div className="relative rounded-[2.5rem] overflow-hidden aspect-[3/4]" style={{ boxShadow: "0 50px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,132,58,0.06), 0 0 80px -20px rgba(212,132,58,0.12)" }}>
                <img src={s.img} alt="Magadh Recipe premium pickles" className="w-full h-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0603]/70 via-transparent to-[#0d0603]/10" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%)" }} />

                {/* FSSAI badge — inside card, top-right */}
                <div className="absolute top-5 right-5 z-10">
                  <div className="flex items-center gap-1.5 backdrop-blur-xl rounded-full px-3 py-1.5" style={{ background: "rgba(13,6,3,0.6)", border: "1px solid rgba(212,132,58,0.12)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-semibold text-white/70 tracking-wide">FSSAI Certified</span>
                  </div>
                </div>

                {/* Bottom info bar — inside card */}
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <div className="backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center justify-between" style={{ background: "rgba(13,6,3,0.65)", border: "1px solid rgba(212,132,58,0.08)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,132,58,0.1)" }}>
                        <span className="text-sm">🏺</span>
                      </div>
                      <div>
                        <p className="text-white/90 font-serif font-bold text-[13px] tracking-wide leading-none">Magadh Recipe</p>
                        <p className="text-brand-400/50 text-[9px] tracking-[0.12em] uppercase mt-1 leading-none">Maa ke Haath ka Swaad</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/[0.05] rounded-full px-2.5 py-1">
                      <Star className="w-2.5 h-2.5 fill-turmeric-400 text-turmeric-400" />
                      <span className="text-white/80 text-[11px] font-bold">4.9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        <button onClick={() => goTo((cur - 1 + SLIDES.length) % SLIDES.length)} className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 hover:border-white/[0.15] transition-all duration-300 backdrop-blur-sm" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex gap-2">
          {SLIDES.map((_, i) => <button key={i} onClick={() => goTo(i)} className={cn("rounded-full transition-all duration-500", i === cur ? "w-10 h-1.5 bg-brand-400" : "w-2 h-1.5 bg-white/15 hover:bg-white/30")} aria-label={`Slide ${i + 1}`} />)}
        </div>
        <button onClick={() => goTo((cur + 1) % SLIDES.length)} className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 hover:border-white/[0.15] transition-all duration-300 backdrop-blur-sm" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* NO bottom fade - dark to dark */}
    </section>
  );
}
