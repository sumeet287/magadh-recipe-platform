"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSchema, type NewsletterInput } from "@/lib/validations/review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Mail } from "lucide-react";

export function NewsletterSignup() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterInput) => {
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSuccess(true);
        reset();
      }
    } catch {
      // Silent error
    }
  };

  return (
    <section
      className="relative overflow-hidden py-24 md:py-36"
      style={{ background: "radial-gradient(ellipse at 30% 70%, #1c0a03 0%, #0a0402 55%, #0d0503 100%)" }}
    >
      {/* Film grain */}
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none z-[1]" aria-hidden />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(212,132,58,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow left */}
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-[0.06]"
        style={{ background: "#D4843A" }} />

      {/* Ambient glow right */}
      <div className="absolute -right-32 top-1/4 w-[400px] h-[400px] rounded-full blur-[130px] pointer-events-none opacity-[0.05]"
        style={{ background: "#c0392b" }} />

      {/* Top divider */}
      <div className="divider-luxury mb-0" />

      <div className="relative z-10 container mx-auto max-w-7xl px-6 lg:px-12 pt-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Editorial headline */}
          <div>
            <p className="text-brand-500/65 text-[10px] font-bold uppercase tracking-[0.35em] mb-6">
              Join the Circle
            </p>
            <h2 className="font-serif font-bold leading-[0.92] mb-8 text-white"
              style={{ fontSize: "clamp(48px, 7vw, 88px)" }}
            >
              Taste it
              <br />
              <span className="shimmer-text">before</span>
              <br />
              they sell out.
            </h2>
            <p className="text-white/35 text-base md:text-lg max-w-sm leading-relaxed">
              25,000+ food lovers get early access, secret recipes & exclusive offers. Join free — unsubscribe anytime.
            </p>

            {/* Benefits row */}
            <div className="flex flex-wrap gap-4 mt-8">
              {["10% off first order", "Early access drops", "Free recipes"].map((b) => (
                <span key={b} className="flex items-center gap-2 text-white/45 text-xs font-medium">
                  <span className="w-1 h-1 rounded-full bg-brand-400" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div>
            {success ? (
              <div
                className="rounded-3xl p-10 flex flex-col items-start gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,132,58,0.15)" }}
              >
                <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl font-serif mb-2">You&apos;re in.</p>
                  <p className="text-white/40 text-sm">Check your inbox — your 10% off coupon is waiting.</p>
                </div>
              </div>
            ) : (
              <div
                className="rounded-3xl p-8 md:p-10"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-white/35 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
                      Your email address
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="hello@youremail.com"
                      className="w-full px-5 py-4 rounded-2xl text-white placeholder:text-white/25 text-sm transition-all duration-200 focus:outline-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,132,58,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,132,58,0.08)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {errors.email && (
                      <p className="text-brand-400 text-xs mt-2">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-glow w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white font-bold text-sm px-7 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Mail className="w-4 h-4" />
                    {isSubmitting ? "Subscribing..." : "Subscribe & Get 10% Off"}
                  </button>
                </form>

                <p className="text-white/20 text-xs mt-5 text-center">
                  No spam. No noise. Pure pickle love.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
