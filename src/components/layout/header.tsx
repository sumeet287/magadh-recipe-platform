"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  Menu,
  X,
  User,
  ChevronDown,
  Phone,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "./cart-drawer";
import { SearchModal } from "./search-modal";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  {
    label: "Products",
    href: "/products",
    submenu: [
      { label: "All Products", href: "/products" },
      { label: "Pickles", href: "/products?category=pickles" },
      { label: "Masalas & Spices", href: "/products?category=masalas" },
      { label: "Combo Packs", href: "/products?category=combo-packs" },
      { label: "Gift Boxes", href: "/products?category=gift-boxes" },
      { label: "Regional Specials", href: "/products?category=regional-specials" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
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

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <>
      {/* Announcement Bar — cinematic marquee */}
      <div className="relative overflow-hidden bg-[#0f0802] text-cream-200/70 py-2 px-4 text-[11px] font-medium tracking-wide">
        <div className="flex whitespace-nowrap marquee-track gap-0">
          {[0,1].map((k) => (
            <span key={k} className="flex items-center gap-0 mr-0">
              {[
                "✦  Free shipping above ₹499",
                "✦  Authentic handcrafted pickles from Bihar",
                "✦  No preservatives · No shortcuts",
                "✦  12,400+ happy customers",
                "✦  Call +91 98765 43210",
                "✦  Traditional Bihar recipes since 1985",
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
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative w-10 h-10">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 via-brand-400 to-turmeric-500 rounded-xl flex items-center justify-center shadow-[0_3px_16px_rgba(212,132,58,0.5)] group-hover:shadow-[0_4px_24px_rgba(212,132,58,0.7)] transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-black text-lg font-serif">M</span>
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-br from-brand-400/30 to-transparent rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="hidden sm:block">
                <div className="font-serif font-bold text-white text-[17px] leading-none tracking-tight">
                  Magadh Recipe
                </div>
                <div className="text-[10px] text-brand-400/70 font-medium tracking-[0.18em] leading-none mt-0.5 uppercase">
                  आचार की असली पहचान
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
                    className={cn(
                      "nav-link-luxury flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors",
                      pathname === link.href || pathname?.startsWith(link.href + "/")
                        ? "text-brand-400 active"
                        : "text-white/75 hover:text-white"
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
                    <div className="absolute top-full left-0 mt-2 bg-[#1a0e07]/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(212,132,58,0.15)] py-2.5 min-w-[210px] animate-fade-in overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
                      {link.submenu.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/65 hover:text-brand-300 hover:bg-brand-500/10 transition-all duration-150 group/sub"
                        >
                          <span className="w-1 h-1 rounded-full bg-brand-400/40 group-hover/sub:bg-brand-500 transition-colors" />
                          {sub.label}
                        </Link>
                      ))}
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
                className="p-2 rounded-lg text-white/55 hover:text-brand-400 transition-colors"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="p-2 rounded-lg text-white/55 hover:text-brand-400 transition-colors hidden sm:block"
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

              {/* User */}
              {session ? (
                <div className="relative group hidden sm:block">
                  <button className="flex items-center gap-2 p-2 rounded-lg text-earth-dark hover:text-brand-600 hover:bg-brand-50 transition-colors">
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
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full text-left px-4 py-2 text-sm text-spice-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white/65 hover:text-white border border-white/15 hover:border-brand-400/50 px-4 py-1.5 rounded-full transition-all duration-200 hover:bg-brand-500/10"
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}

              {/* Mobile Menu */}
              <button
                onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
                className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/8 bg-[#0f0802]/98 backdrop-blur-xl animate-slide-in-left">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                      pathname === link.href
                        ? "text-brand-400 bg-brand-500/12"
                        : "text-white/75 hover:text-white hover:bg-white/6"
                    )}
                  >
                    {link.label}
                  </Link>
                  {link.submenu && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-brand-400/20 pl-4">
                      {link.submenu.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-3 py-2 text-sm text-white/45 hover:text-brand-300 rounded-lg hover:bg-brand-500/10 transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {session ? (
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-earth-dark">{session.user?.name}</p>
                  </div>
                  <Link href="/account" className="block px-4 py-2.5 text-sm text-earth-dark hover:bg-brand-50 rounded-xl">My Account</Link>
                  <Link href="/account/orders" className="block px-4 py-2.5 text-sm text-earth-dark hover:bg-brand-50 rounded-xl">My Orders</Link>
                  <Link href="/account/wishlist" className="block px-4 py-2.5 text-sm text-earth-dark hover:bg-brand-50 rounded-xl">Wishlist</Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left px-4 py-2.5 text-sm text-spice-600 hover:bg-red-50 rounded-xl">Sign Out</button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-100 flex gap-3">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Search Modal */}
      {isSearchOpen && <SearchModal />}
    </>
  );
}
