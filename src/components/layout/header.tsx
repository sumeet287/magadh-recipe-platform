"use client";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  User,
  ChevronDown,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";
import dynamic from "next/dynamic";
const CartDrawer = dynamic(() => import("./cart-drawer").then(m => m.CartDrawer), { ssr: false });
const SearchModal = dynamic(() => import("./search-modal").then(m => m.SearchModal), { ssr: false });
const FullscreenMenu = dynamic(() => import("./fullscreen-menu").then(m => m.FullscreenMenu), { ssr: false });

const NAV_LINKS = [
  { label: "Home", href: "/" },
  {
    label: "Products",
    href: "/products",
    submenu: [
      { label: "All Products", href: "/products" },
      { label: "Mango", href: "/products?tags=mango" },
      { label: "Lemon", href: "/products?tags=lemon" },
      { label: "Green Chilli", href: "/products?tags=green-chilli" },
      { label: "Garlic", href: "/products?tags=garlic" },
      { label: "Karonda", href: "/products?tags=karonda" },
      { label: "Kathal Pickle", href: "/products?tags=kathal" },
      { label: "Mixed Pickle", href: "/products?tags=mixed" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { itemCount, setOpen: setCartOpen } = useCartStore();
  const { isSearchOpen, openSearch, isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUIStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <>
      {/* Announcement Bar — cinematic marquee */}
      <div className="relative overflow-hidden bg-[#0f0802] text-cream-200/90 py-2 px-4 text-xs font-medium tracking-wide">
        <div className="flex whitespace-nowrap marquee-track gap-0">
          {[0,1].map((k) => (
            <span key={k} className="flex items-center gap-0 mr-0">
              {[
                "✦  Free Shipping above ₹499",
                "✦  Born from Maa's Kitchen in Bihar",
                "✦  Zero Preservatives · Zero Shortcuts",
                "✦  50,000+ Happy Families",
                "✦  FSSAI Certified · 100% Natural",
                "✦  Traditional Recipes · Handcrafted with Love",
                "✦  Order on WhatsApp @ +916207197364",
              ].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-6 pr-12">
                  <span className={i % 3 === 1 ? "text-brand-400 font-semibold" : ""}>{item}</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500 backdrop-blur-xl",
          isScrolled
            ? "shadow-[0_1px_40px_rgba(0,0,0,0.5)] border-b border-[rgba(212,132,58,0.15)]"
            : "border-b border-[rgba(255,255,255,0.05)]"
        )}
        style={{ backgroundColor: isScrolled ? "rgba(15,8,2,0.97)" : "rgba(15,8,2,0.92)" }}
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" onClick={(e) => handleNavClick(e, "/")} className="flex items-center gap-2 sm:gap-3 shrink-0 group">
              <img
                src="/images/brand/logo.png"
                alt="Magadh Recipe"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-[0_3px_16px_rgba(212,132,58,0.5)] group-hover:shadow-[0_4px_24px_rgba(212,132,58,0.7)] transition-all duration-300 group-hover:scale-105"
              />
              <div>
                <div className="font-serif font-bold text-white text-[15px] sm:text-[17px] leading-none tracking-tight">
                  Magadh Recipe
                </div>
                <div className="hidden sm:block text-[11px] text-brand-400 font-medium tracking-[0.18em] leading-none mt-0.5 uppercase">
                  माँ के हाथ का स्वाद
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => link.submenu && setActiveSubmenu(link.label)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "nav-link-luxury flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors",
                      pathname === link.href || pathname?.startsWith(link.href + "/")
                        ? "text-brand-400 active"
                        : "text-white/90 hover:text-white"
                    )}
                  >
                    {link.label}
                    {link.submenu && (
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform",
                          activeSubmenu === link.label && "rotate-180"
                        )}
                      />
                    )}
                  </Link>

                  {/* Luxury Dropdown */}
                  {link.submenu && activeSubmenu === link.label && (
                    <div className="absolute top-full left-0 pt-2">
                      <div className="bg-[#1a0e07]/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(212,132,58,0.15)] py-2.5 min-w-[210px] animate-fade-in overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
                        {link.submenu.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/85 hover:text-brand-300 hover:bg-brand-500/10 transition-all duration-150 group/sub"
                          >
                            <span className="w-1 h-1 rounded-full bg-brand-400/40 group-hover/sub:bg-brand-500 transition-colors" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={openSearch}
                className="p-2 rounded-lg text-white/80 hover:text-brand-400 transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="p-2 rounded-lg text-white/80 hover:text-brand-400 transition-colors hidden sm:block"
                aria-label="Wishlist"
              >
                <Heart className="w-[18px] h-[18px]" />
              </Link>

              {/* Cart — premium pill */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-[#1a0e07] text-white hover:bg-brand-600 transition-all duration-300 shadow-[0_2px_14px_rgba(26,14,7,0.25)] hover:shadow-[0_3px_20px_rgba(212,132,58,0.4)]"
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs font-bold min-w-[1ch]">{itemCount > 0 ? itemCount : "0"}</span>
              </button>

              {/* User — desktop: pill + hover menu; mobile: icon → account/login */}
              {session ? (
                <>
                  <Link
                    href="/account"
                    className="sm:hidden p-2 rounded-lg text-white/80 hover:text-brand-400 transition-colors"
                    aria-label="My account"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-400/40 flex items-center justify-center text-brand-300 text-xs font-bold">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  </Link>
                  <div className="relative group hidden sm:block">
                    <button type="button" className="flex items-center gap-2 p-2 rounded-lg text-earth-dark hover:text-brand-600 hover:bg-brand-50 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                        {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-card-hover border border-gray-100 py-2 min-w-[160px] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-xs font-semibold text-earth-dark truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {session.user?.email}
                        </p>
                      </div>
                      <Link href="/account" className="block px-4 py-2 text-sm text-earth-dark hover:text-brand-600 hover:bg-brand-50">
                        My Account
                      </Link>
                      <Link href="/account/orders" className="block px-4 py-2 text-sm text-earth-dark hover:text-brand-600 hover:bg-brand-50">
                        My Orders
                      </Link>
                      {(session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN") && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 font-medium">
                          Admin Panel
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="block w-full text-left px-4 py-2 text-sm text-spice-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="sm:hidden p-2 rounded-lg text-white/80 hover:text-brand-400 transition-colors"
                    aria-label="Log in"
                  >
                    <User className="w-[18px] h-[18px]" />
                  </Link>
                  <Link
                    href="/login"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white border border-white/25 hover:border-brand-400/50 px-4 py-1.5 rounded-full transition-all duration-200 hover:bg-brand-500/10"
                  >
                    <User className="w-4 h-4" />
                    Login
                  </Link>
                </>
              )}

              {/* Menu Button — mobile/tablet */}
              <button
                onClick={openMobileMenu}
                className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white transition-colors ml-1"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* CRED-style Fullscreen Menu */}
      <FullscreenMenu />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Search Modal */}
      {isSearchOpen && <SearchModal />}
    </>
  );
}
