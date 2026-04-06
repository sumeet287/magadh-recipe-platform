import { type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-earth-dark via-brand-900 to-spice-900 p-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #f97316 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-serif font-bold text-lg">
            M
          </div>
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
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-serif font-bold">
              M
            </div>
            <p className="font-serif font-bold text-lg text-earth-dark">Magadh Recipe</p>
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
