import { type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      {/* Close / Back to site */}
      <Link
        href="/"
        className="absolute top-4 right-4 sm:top-5 sm:right-5 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-earth-200 bg-white/95 text-earth-600 shadow-md backdrop-blur-sm hover:bg-cream-50 hover:text-earth-dark hover:border-brand-400/35 hover:shadow-lg transition-all duration-300 hover:rotate-90"
        aria-label="Close and go to homepage"
      >
        <X className="w-5 h-5" strokeWidth={2.25} />
      </Link>

      {/* Left: Decorative panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-earth-dark via-brand-900 to-spice-900 p-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #f97316 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <Image
            src="/images/brand/logo.png"
            alt="Magadh Recipe"
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl object-contain shadow-[0_3px_16px_rgba(212,132,58,0.4)]"
          />
          <div>
            <p className="font-serif font-bold text-xl leading-none">Magadh Recipe</p>
            <p className="text-white/60 text-xs mt-0.5">Premium Indian Pickles & Spices</p>
          </div>
        </Link>

        {/* Tagline */}
        <div className="relative z-10">
          <blockquote className="font-serif text-2xl font-bold leading-relaxed mb-4">
            &ldquo;The flavours of Bihar, delivered to your doorstep.&rdquo;
          </blockquote>
          <p className="text-white/70 leading-relaxed">
            Authentic recipes passed down through generations. Hand-crafted with care, packed with love.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6">
            {[
              { value: "50+", label: "Products" },
              { value: "10K+", label: "Customers" },
              { value: "4.8★", label: "Rating" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-serif text-2xl font-bold text-brand-300">{value}</p>
                <p className="text-xs text-white/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="flex items-center gap-2 text-sm text-white/60 relative z-10">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          All products 100% Natural &amp; Preservative-free
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/brand/logo.png"
              alt="Magadh Recipe"
              width={36}
              height={36}
              className="w-9 h-9 rounded-xl object-contain shadow-[0_2px_12px_rgba(212,132,58,0.35)]"
            />
            <p className="font-serif font-bold text-lg text-earth-dark">Magadh Recipe</p>
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
