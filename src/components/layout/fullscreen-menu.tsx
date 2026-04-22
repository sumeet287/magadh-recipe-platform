"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { X, ArrowRight, User, LogIn, Package, Heart, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products", sub: [
    { label: "Mango", href: "/products?tags=mango" },
    { label: "Lemon", href: "/products?tags=lemon" },
    { label: "Green Chilli", href: "/products?tags=green-chilli" },
    { label: "Garlic", href: "/products?tags=garlic" },
    { label: "Karonda", href: "/products?tags=karonda" },
    { label: "Kathal", href: "/products?tags=kathal" },
    { label: "Mixed Pickle", href: "/products?tags=mixed" },
    { label: "Oal Pickle", href: "/products?tags=oal" },
  ]},
  { label: "Stories", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function FullscreenMenu() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => { closeMobileMenu(); }, [pathname, closeMobileMenu]);

  const handleClose = () => {
    setClosing(true);
    document.body.style.overflow = "";
    setTimeout(() => { closeMobileMenu(); setVisible(false); setClosing(false); }, 350);
  };

  if (!visible) return null;

  return (
    <div
      className={cn("fixed inset-0 z-[100] flex flex-col", closing ? "menu-overlay-exit" : "menu-overlay-enter")}
      style={{ background: "#080402" }}
    >
      {/* Grain */}
      <div className="hero-grain-overlay absolute inset-0 pointer-events-none" />

      {/* Subtle glow */}
      <div className="absolute pointer-events-none opacity-40" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(212,132,58,0.08) 0%, transparent 70%)", bottom: "10%", left: "20%", filter: "blur(80px)" }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 border-b border-white/[0.04]">
        <Link href="/" onClick={handleClose} className="flex items-center gap-3">
          <Image
            src="/images/brand/logo.png"
            alt="Magadh Recipe"
            width={36}
            height={36}
            sizes="36px"
            className="w-9 h-9 rounded-xl object-contain shadow-[0_2px_12px_rgba(212,132,58,0.4)]"
          />
          <span className="font-serif font-bold text-white text-base">Magadh Recipe</span>
        </Link>
        <button
          onClick={handleClose}
          className="w-11 h-11 rounded-full border border-white/[0.15] flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 hover:bg-white/[0.05] transition-all duration-300 hover:rotate-90"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links - centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col justify-center min-h-0 overflow-y-auto px-6 sm:px-10 lg:px-16 max-w-3xl py-4">
        <nav className="space-y-0">
          {LINKS.map((link, i) => (
            <div key={link.href} className="border-b border-white/[0.03]">
              <Link
                href={link.href}
                onClick={handleClose}
                className={cn(
                  "menu-link-animate group flex items-center gap-5 py-5 sm:py-6 transition-all duration-300",
                  pathname === link.href ? "text-brand-400" : "text-white/90 hover:text-white hover:pl-3"
                )}
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              >
                <span className="text-brand-400/50 font-mono text-xs tabular-nums w-6">0{i + 1}</span>
                <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-none">
                  {link.label}
                </span>
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-50 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 ml-auto" />
              </Link>

              {link.sub && (
                <div className="flex flex-wrap gap-2 pb-4 pl-11 -mt-1 menu-link-animate" style={{ animationDelay: `${i * 100 + 200}ms` }}>
                  {link.sub.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={handleClose}
                      className="text-xs text-white/50 hover:text-brand-300 px-3.5 py-1.5 rounded-full border border-white/[0.12] hover:border-brand-400/40 hover:bg-brand-500/10 transition-all duration-200"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Account — visible on mobile/tablet where header login was hidden */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-1 menu-link-animate" style={{ animationDelay: `${(LINKS.length + 1) * 100}ms` }}>
          <p className="text-[10px] text-white/35 uppercase tracking-[0.22em] font-medium mb-3">Account</p>
          {session ? (
            <div className="flex flex-col gap-0.5">
              <Link
                href="/account"
                onClick={handleClose}
                className="flex items-center gap-3 py-3 text-white/85 hover:text-brand-300 text-sm transition-colors"
              >
                <User className="w-4 h-4 text-brand-400/70 shrink-0" />
                My account
              </Link>
              <Link
                href="/account/orders"
                onClick={handleClose}
                className="flex items-center gap-3 py-3 text-white/85 hover:text-brand-300 text-sm transition-colors"
              >
                <Package className="w-4 h-4 text-brand-400/70 shrink-0" />
                My orders
              </Link>
              <Link
                href="/account/wishlist"
                onClick={handleClose}
                className="flex items-center gap-3 py-3 text-white/85 hover:text-brand-300 text-sm transition-colors"
              >
                <Heart className="w-4 h-4 text-brand-400/70 shrink-0" />
                Wishlist
              </Link>
              {(session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN") && (
                <Link
                  href="/admin"
                  onClick={handleClose}
                  className="flex items-center gap-3 py-3 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Admin panel
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-3 py-3 text-left text-spice-400/90 hover:text-spice-300 text-sm transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={handleClose}
              className="inline-flex items-center gap-2.5 py-3.5 px-5 rounded-full border border-brand-400/35 bg-brand-500/15 text-brand-200 text-sm font-semibold hover:bg-brand-500/25 hover:border-brand-400/50 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Log in / Register
            </Link>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-5 border-t border-white/[0.04] flex items-center justify-between">
        <div className="flex gap-8">
          {["Instagram", "Facebook", "YouTube"].map((s, i) => (
            <a key={s} href="#" className="menu-link-animate text-xs text-white/40 hover:text-brand-400 uppercase tracking-[0.2em] font-medium transition-colors" style={{ animationDelay: `${(LINKS.length + i) * 100 + 100}ms` }}>
              {s}
            </a>
          ))}
        </div>
        <span className="text-xs text-white/30 tracking-widest uppercase">माँ के हाथ का स्वाद</span>
      </div>
    </div>
  );
}
