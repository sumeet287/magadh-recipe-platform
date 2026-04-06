"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Spice Particle Canvas — GPU canvas, zero external deps
   Colored geometric specks float upward like spice dust/steam
───────────────────────────────────────────────────────────── */
type PShape = "circle" | "rect" | "diamond";
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; alpha: number; alphaDir: number;
  rot: number; rotSpd: number; shape: PShape;
}
const SPICE_COLORS = ["#D4843A","#f0c579","#e8a951","#bf4b2e","#c0914a","#e8a43f","#f5cf7a","#b87333"];

function SpiceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const particles: Particle[] = [];
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W() * dpr;
      canvas.height = H() * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (startY?: number): Particle => ({
      x: W() * 0.22 + Math.random() * W() * 0.78,
      y: startY ?? H() + 10,
      vx: (Math.random() - 0.5) * 1.1,
      vy: -(0.45 + Math.random() * 1.4),
      size: 2.5 + Math.random() * 6,
      color: SPICE_COLORS[Math.floor(Math.random() * SPICE_COLORS.length)],
      alpha: 0,
      alphaDir: 0.005 + Math.random() * 0.009,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.045,
      shape: (["circle","rect","diamond"] as PShape[])[Math.floor(Math.random() * 3)],
    });
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    for (let i = 0; i < 75; i++) {
      const p = spawn(); p.y = Math.random() * H(); p.alpha = Math.random() * 0.55;
      particles.push(p);
    }
    const drawP = (p: Particle) => {
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      const s = p.size;
      if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0,0,s*0.5,0,Math.PI*2); ctx.fill(); }
      else if (p.shape === "rect") { ctx.fillRect(-s*0.5,-s*0.3,s,s*0.6); }
      else { ctx.beginPath(); ctx.moveTo(0,-s*0.5); ctx.lineTo(s*0.42,0); ctx.lineTo(0,s*0.5); ctx.lineTo(-s*0.42,0); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    };
    const tick = () => {
      ctx.clearRect(0, 0, W(), H());
      if (particles.length < 95 && Math.random() < 0.35) particles.push(spawn());
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.rot += p.rotSpd;
        const yr = p.y / H();
        if (yr > 0.6) p.alpha = Math.min(p.alpha + p.alphaDir, 0.65);
        else p.alpha -= p.alphaDir * 0.55;
        if (p.alpha <= 0 || p.y < -20) { particles.splice(i,1); continue; }
        drawP(p);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />;
}

/* ─────────────────────────────────────────────────────────────
   Rotating SVG text ring + glowing orb visual
───────────────────────────────────────────────────────────── */
function RotatingRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
      {/* Outermost glow halo */}
      <div className="absolute rounded-full" style={{ width:"min(560px,90vw)", height:"min(560px,90vw)", background:"radial-gradient(circle, rgba(212,132,58,0.04) 60%, transparent 72%)", filter:"blur(8px)" }} />
      {/* Outer border */}
      <div className="absolute rounded-full border border-brand-400/14" style={{ width:"min(520px,86vw)", height:"min(520px,86vw)" }} />
      {/* Rotating text */}
      <div className="absolute" style={{ width:"min(420px,80vw)", height:"min(420px,80vw)", animation:"ring-rotate 28s linear infinite" }}>
        <svg viewBox="0 0 320 320" className="w-full h-full">
          <defs>
            <path id="rp" d="M 160,160 m -130,0 a 130,130 0 1,1 260,0 a 130,130 0 1,1 -260,0" />
          </defs>
          <text fill="#D4843A" fontSize="12" fontFamily="Georgia,serif" letterSpacing="6" opacity="0.65" fontWeight="700">
            <textPath href="#rp">HANDCRAFTED · PURE INGREDIENTS · BIHAR SPECIAL · NO PRESERVATIVES · </textPath>
          </text>
        </svg>
      </div>
      {/* Inner dashed ring — counter-rotates */}
      <div className="absolute rounded-full" style={{ width:"min(300px,60vw)", height:"min(300px,60vw)", border:"1px dashed rgba(212,132,58,0.22)", animation:"ring-rotate 20s linear infinite reverse" }} />
      {/* Mid glow ring */}
      <div className="absolute rounded-full" style={{ width:"min(240px,48vw)", height:"min(240px,48vw)", background:"transparent", border:"1px solid rgba(212,132,58,0.08)", boxShadow:"0 0 60px rgba(212,132,58,0.12), inset 0 0 60px rgba(212,132,58,0.06)" }} />
      {/* Pulsing center orb — larger and brighter */}
      <div className="absolute rounded-full" style={{ width:"min(200px,40vw)", height:"min(200px,40vw)", background:"radial-gradient(circle, rgba(212,132,58,0.28) 0%, rgba(212,132,58,0.1) 40%, rgba(212,132,58,0.03) 65%, transparent 80%)", animation:"orb-pulse 4s ease-in-out infinite", filter:"blur(2px)" }} />
      {/* Bright center point */}
      <div className="absolute rounded-full z-10" style={{ width:"min(72px,12vw)", height:"min(72px,12vw)", background:"radial-gradient(circle, rgba(255,200,100,0.45) 0%, rgba(212,132,58,0.35) 40%, transparent 70%)", border:"1px solid rgba(212,132,58,0.4)", boxShadow:"0 0 40px rgba(212,132,58,0.4), 0 0 80px rgba(212,132,58,0.2), inset 0 0 20px rgba(255,200,100,0.2)" }} />
      {/* Center dot */}
      <div className="absolute rounded-full z-20" style={{ width:"8px", height:"8px", background:"#f5cf7a", boxShadow:"0 0 16px #D4843A, 0 0 32px rgba(212,132,58,0.6)" }} />
      {/* Cross-hair lines */}
      <div className="absolute" style={{ width:"min(520px,86vw)", height:"1px", background:"linear-gradient(to right, transparent 0%, rgba(212,132,58,0.04) 25%, rgba(212,132,58,0.18) 50%, rgba(212,132,58,0.04) 75%, transparent 100%)" }} />
      <div className="absolute" style={{ height:"min(520px,86vw)", width:"1px", background:"linear-gradient(to bottom, transparent 0%, rgba(212,132,58,0.04) 25%, rgba(212,132,58,0.18) 50%, rgba(212,132,58,0.04) 75%, transparent 100%)" }} />
      {/* Four corner accent dots */}
      {[["-46%","-46%"],["-46%","46%"],["46%","-46%"],["46%","46%"]].map(([t,l],i) => (
        <div key={i} className="absolute rounded-full" style={{ width:"5px", height:"5px", background:"rgba(212,132,58,0.5)", top:`calc(50% + ${t})`, left:`calc(50% + ${l})`, transform:"translate(-50%,-50%)", boxShadow:"0 0 8px rgba(212,132,58,0.5)" }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ScrambleText — letters shuffle before locking in
───────────────────────────────────────────────────────────── */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&*";
function ScrambleText({ text, trigger, className }: { text: string; trigger: number; className?: string }) {
  const [display, setDisplay] = useState(text);
  const rafRef = useRef(0);
  useEffect(() => {
    let frame = 0; const total = 30;
    const step = () => {
      frame++;
      const locked = Math.floor((frame / total) * text.length);
      if (frame >= total) { setDisplay(text); return; }
      setDisplay(text.split("").map((ch, i) => {
        if (ch === " ") return " ";
        if (i < locked) return ch;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join(""));
      rafRef.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(rafRef.current);
    setDisplay(text.split("").map(c => c === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]).join(""));
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, text]);
  return <span className={className}>{display}</span>;
}

/* ── Magnetic Button ── */
function MagneticBtn({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const frame = useRef(0);
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX-(r.left+r.width/2))*0.36}px,${(e.clientY-(r.top+r.height/2))*0.36}px)`;
    });
  }, []);
  const onLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const el = ref.current; if (!el) return;
    el.style.transition = "transform 0.55s cubic-bezier(.03,.98,.52,.99)";
    el.style.transform = "translate(0,0)";
    setTimeout(() => { if (el) el.style.transition = ""; }, 600);
  }, []);
  return <Link ref={ref} href={href} className={className} onMouseMove={onMove} onMouseLeave={onLeave}>{children}</Link>;
}

/* ── Animated stat counter ── */
function StatCounter({ display, label, active }: { display: string; label: string; active: boolean }) {
  const [val, setVal] = useState("0");
  const done = useRef(false);
  useEffect(() => {
    if (!active || done.current) return;
    done.current = true;
    const isNum = /^\d/.test(display);
    if (!isNum) { setVal(display); return; }
    const raw = parseInt(display.replace(/\D/g,""), 10);
    const suffix = display.replace(/^\d+/,"");
    const dur = 1500; const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now-start)/dur, 1);
      const ease = 1-(1-t)**3;
      const cur = Math.round(ease*raw);
      setVal((raw>=1000?`${Math.round(cur/1000)}K`:`${cur}`)+suffix);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, display]);
  return (
    <div>
      <div className="text-4xl sm:text-5xl font-bold text-brand-400 font-serif tabular-nums leading-none mb-1.5 text-glow-gold">{val}</div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/45 font-semibold">{label}</div>
    </div>
  );
}

const SLIDES = [
  {
    id: 1,
    eyebrow: "Handcrafted in Bihar",
    tag: "New Collection",
    headingLine1: "The Art of",
    headingLine2: "Authentic",
    headingLine3: "Pickling",
    subtext: "Flavours passed down through generations — no preservatives, no shortcuts. Pure handpicked ingredients, the traditional way.",
    cta: { label: "Explore Pickles", href: "/products?category=pickles" },
    ctaSecondary: { label: "Our Story", href: "/about" },
    stats: [
      { display: "50K+", label: "Happy Customers" },
      { display: "25+", label: "Products" },
      { display: "100%", label: "Natural" },
    ],
  },
  {
    id: 2,
    eyebrow: "Premium Gift Hampers",
    tag: "Festival Special",
    headingLine1: "Gift the",
    headingLine2: "Taste of",
    headingLine3: "Bihar",
    subtext: "Curated hampers packed with our bestselling pickles and masalas. Make every occasion special with authentic Bihar flavours.",
    cta: { label: "Shop Gift Boxes", href: "/products?category=gift-boxes" },
    ctaSecondary: { label: "Combo Packs", href: "/products?category=combo-packs" },
    stats: [
      { display: "5★", label: "Avg Rating" },
      { display: "12K+", label: "Reviews" },
      { display: "0%", label: "Preservatives" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   Main HeroBanner
───────────────────────────────────────────────────────────── */
export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [statsActive, setStatsActive] = useState(false);
  const [scrambleTick, setScrambleTick] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rightRef   = useRef<HTMLDivElement>(null);
  const spotRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef(0);

  // Parallax on mouse move
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = sectionRef.current; if (!el) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top  - r.height / 2;
      if (contentRef.current) contentRef.current.style.transform = `translate(${x*0.008}px,${y*0.008}px)`;
      if (rightRef.current)   rightRef.current.style.transform   = `translate(${x*0.022}px,${y*0.022}px)`;
      if (spotRef.current) {
        const px = ((e.clientX - r.left) / r.width)  * 100;
        const py = ((e.clientY - r.top)  / r.height) * 100;
        spotRef.current.style.background = `radial-gradient(550px at ${px}% ${py}%, rgba(212,132,58,0.09) 0%, transparent 60%)`;
        spotRef.current.style.opacity = "1";
      }
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    [contentRef, rightRef].forEach((r) => {
      if (!r.current) return;
      r.current.style.transition = "transform 1s cubic-bezier(.03,.98,.52,.99)";
      r.current.style.transform  = "";
      setTimeout(() => { if (r.current) r.current.style.transition = ""; }, 1050);
    });
    if (spotRef.current) spotRef.current.style.opacity = "0";
  }, []);

  // Auto slide
  useEffect(() => {
    const t = setInterval(() => {
      setAnimating(true); setStatsActive(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setAnimating(false);
        setScrambleTick((n) => n + 1);
        setTimeout(() => setStatsActive(true), 300);
      }, 400);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setStatsActive(true); setScrambleTick(1); }, 600);
    return () => clearTimeout(t);
  }, []);

  const goTo = (idx: number) => {
    if (idx === current) return;
    setAnimating(true); setStatsActive(false);
    setTimeout(() => {
      setCurrent(idx); setAnimating(false);
      setScrambleTick((n) => n + 1);
      setTimeout(() => setStatsActive(true), 300);
    }, 300);
  };

  const slide = SLIDES[current];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[92vh] flex items-center"
      style={{ background: "radial-gradient(ellipse at 22% 60%, #3d1a06 0%, #2a1005 25%, #140804 60%, #0a0402 100%)" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Warm left-side glow behind content */}
      <div className="absolute pointer-events-none" style={{ left: "-5%", top: "10%", width: "55%", height: "80%", background: "radial-gradient(ellipse at 30% 50%, rgba(90,35,8,0.65) 0%, rgba(50,18,5,0.4) 40%, transparent 75%)", filter: "blur(40px)" }} aria-hidden />

      {/* Spice particle canvas — full section */}
      <SpiceCanvas />

      {/* Cursor spotlight */}
      <div ref={spotRef} className="absolute inset-0 pointer-events-none z-[1] opacity-0 transition-opacity duration-300" aria-hidden />

      {/* Film grain overlay */}
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none z-[90]" aria-hidden />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: "radial-gradient(circle, #D4843A 1px, transparent 1px)", backgroundSize: "38px 38px" }}
        aria-hidden
      />

      {/* Two-column layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 min-h-[92vh] grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-8 py-20 lg:py-0">

        {/* ── LEFT: content ── */}
        <div ref={contentRef} className="will-change-transform lg:py-32">

          {/* Eyebrow */}
          <div className={cn(
            "inline-flex items-center gap-2.5 mb-8 transition-all duration-500",
            animating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
          )}>
            <span className="flex items-center gap-1.5 bg-brand-500/12 border border-brand-400/25 text-brand-300 text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full">
              <Star className="w-3 h-3 fill-brand-400 text-brand-400" />
              {slide.tag}
            </span>
            <span className="text-brand-400/45 text-xs font-medium hidden sm:block tracking-widest">{slide.eyebrow}</span>
          </div>

          {/* Headline */}
          <h1 className={cn(
            "font-serif leading-[1.0] mb-7 transition-all duration-500 delay-75",
            animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}>
            <span className="block text-white text-glow-white text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight">
              {slide.headingLine1}
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-[5.5rem] font-bold shimmer-text tracking-tight">
              <ScrambleText text={slide.headingLine2} trigger={scrambleTick} />
            </span>
            <span className="block text-white text-glow-white text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight">
              {slide.headingLine3}
            </span>
          </h1>

          {/* Subtext */}
          <p className={cn(
            "text-white/75 text-base sm:text-lg leading-relaxed mb-10 max-w-[420px] transition-all duration-500 delay-100",
            animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          )}>
            {slide.subtext}
          </p>

          {/* Magnetic CTAs */}
          <div className={cn(
            "flex flex-wrap gap-4 mb-14 transition-all duration-500 delay-150",
            animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          )}>
            <MagneticBtn
              href={slide.cta.href}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white font-semibold text-sm px-7 py-3.5 rounded-full shadow-[0_4px_28px_rgba(212,132,58,0.45)] hover:shadow-[0_6px_44px_rgba(212,132,58,0.7)] transition-colors duration-300"
            >
              {slide.cta.label} <ArrowRight className="w-4 h-4" />
            </MagneticBtn>
            <MagneticBtn
              href={slide.ctaSecondary.href}
              className="inline-flex items-center gap-2 border border-cream-200/22 text-cream-200 hover:border-brand-400/55 hover:text-brand-300 font-semibold text-sm px-7 py-3.5 rounded-full backdrop-blur-sm hover:bg-brand-500/5 transition-colors duration-300"
            >
              {slide.ctaSecondary.label}
            </MagneticBtn>
          </div>

          {/* Stat counters */}
          <div className={cn(
            "flex gap-10 sm:gap-14 transition-all duration-500 delay-200",
            animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
          )}>
            {slide.stats.map((s, i) => (
              <div key={s.label} className="relative">
                {i !== 0 && <div className="absolute -left-5 sm:-left-7 top-1/4 h-1/2 w-px bg-white/10" />}
                <StatCounter display={s.display} label={s.label} active={statsActive} />
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: rotating ring + spice visual ── */}
        <div
          ref={rightRef}
          className="hidden lg:block relative will-change-transform"
          style={{ height: "92vh" }}
          aria-hidden
        >
          <RotatingRing />
          {/* Ghost watermark stat number */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{ opacity: 0.028 }}
          >
            <span className="font-serif font-black text-brand-400" style={{ fontSize: "clamp(120px,18vw,210px)", lineHeight: 1 }}>
              {slide.stats[0].display}
            </span>
          </div>
        </div>
      </div>

      {/* ── Slide Controls ── */}
      <div className="absolute bottom-8 left-6 lg:left-12 flex items-center gap-4 z-10">
        <div className="flex gap-2 items-center">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                "rounded-full transition-all duration-300 cursor-pointer",
                idx === current ? "w-10 h-2 bg-brand-400" : "w-2 h-2 bg-white/22 hover:bg-white/45"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
            className="w-8 h-8 rounded-full border border-white/14 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo((current + 1) % SLIDES.length)}
            className="w-8 h-8 rounded-full border border-white/14 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
