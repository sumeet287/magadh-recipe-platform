"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSchema, type NewsletterInput } from "@/lib/validations/review";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export function NewsletterSignup() {
  const ref = useScrollReveal<HTMLElement>();
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
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { setSuccess(true); reset(); }
    } catch { /* silent */ }
  };

  return (
    <section
      ref={ref}
                  className="relative overflow-hidden py-16 md:py-20"
      style={{ background: "linear-gradient(180deg, #120804 0%, #1a0c06 50%, #0d0603 100%)" }}
    >
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />
      <div className="absolute pointer-events-none" style={{ width: 500, height: 400, background: "radial-gradient(circle, rgba(212,132,58,0.04) 0%, transparent 70%)", top: "30%", left: "40%", filter: "blur(80px)" }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/10 to-transparent" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="fade-up section-label text-brand-400/50 mb-5" data-reveal>Join the Family</p>
          <h2 className="fade-up font-serif text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] mb-6" data-reveal data-delay="1">
            Get a Taste of <span className="shimmer-text">Magadh</span>
          </h2>
          <p className="fade-up text-white/30 text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-12" data-reveal data-delay="2">
            25,000+ families get early access, Maa&apos;s secret recipes & exclusive festival offers. Join free.
          </p>

          <div className="fade-up max-w-md mx-auto" data-reveal data-delay="3">
            {success ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl font-serif mb-1">You&apos;re in!</p>
                  <p className="text-white/40 text-sm">Check your inbox — your 10% off coupon is waiting.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="relative">
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-6 py-4 pr-36 rounded-full text-white placeholder:text-white/20 text-sm bg-white/[0.04] border border-white/[0.06] focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/10 transition-all duration-200 outline-none backdrop-blur-sm"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-full transition-all duration-300 shadow-[0_4px_20px_rgba(212,132,58,0.3)]"
                >
                  {isSubmitting ? "..." : "Subscribe"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
            {errors.email && <p className="text-red-400 text-xs mt-3">{errors.email.message}</p>}
            <p className="text-white/15 text-xs mt-5">No spam. Unsubscribe anytime. Get 10% off your first order.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
