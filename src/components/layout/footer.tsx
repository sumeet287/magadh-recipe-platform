import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Twitter, Phone, Mail, MapPin } from "lucide-react";
import {
  APP_NAME,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  BRAND_ADDRESS,
  FSSAI_REGISTRATION_NUMBER,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const staticFooterLinks = {
  "Quick Links": [
    { label: "Home", href: "/" },
    { label: "All Products", href: "/products" },
    { label: "Stories", href: "/blog" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/account/orders" },
  ],
  "Our Pickles": [
    { label: "Mango Pickle", href: "/products/aam-kuccha-pickle" },
    { label: "Lemon Pickle", href: "/products/lemon-pickle" },
    { label: "Green Chilli", href: "/products/green-chilli-pickle" },
    { label: "Garlic Pickle", href: "/products/garlic-pickle" },
    { label: "Karonda Pickle", href: "/products/karonda-pickle" },
    { label: "Khatta Meetha", href: "/products/khatta-meetha-lemon-pickle" },
  ],
  "Policies": [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms & Conditions", href: "/legal/terms" },
    { label: "Shipping Policy", href: "/legal/shipping" },
    { label: "FAQ", href: "/contact#faq" },
  ],
};

async function getRecentStories(): Promise<{ label: string; href: string }[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { slug: true, title: true },
    });
    return posts.map((p) => ({
      label: p.title.length > 48 ? `${p.title.slice(0, 45)}…` : p.title,
      href: `/blog/${p.slug}`,
    }));
  } catch {
    return [];
  }
}

export async function Footer() {
  const recentStories = await getRecentStories();
  const footerLinks: Record<string, { label: string; href: string }[]> = {
    ...staticFooterLinks,
  };
  if (recentStories.length > 0) {
    footerLinks["Latest Stories"] = [
      ...recentStories,
      { label: "View all stories →", href: "/blog" },
    ];
  }

  return (
    <footer className="bg-earth-dark text-cream-200">
      {/* Main Footer */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <Image
                src="/images/brand/logo.png"
                alt="Magadh Recipe"
                width={40}
                height={40}
                sizes="40px"
                loading="lazy"
                className="w-10 h-10 rounded-xl object-contain shadow-[0_3px_16px_rgba(212,132,58,0.4)]"
              />
              <div>
                <div className="font-serif font-bold text-cream-100 text-lg leading-none">
                  {APP_NAME}
                </div>
                <div className="text-[11px] text-brand-400 font-medium tracking-wider leading-none mt-0.5">
                  माँ के हाथ का स्वाद
                </div>
              </div>
            </Link>

            <p className="text-sm text-cream-200/90 leading-relaxed mb-6 max-w-xs">
              Born from a mother&apos;s kitchen in Bihar — premium handcrafted pickles & achars. 
              Every jar carries generations of love, tradition, and the finest ingredients.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: SOCIAL_LINKS.instagram, label: "Instagram" },
                { Icon: Facebook, href: SOCIAL_LINKS.facebook, label: "Facebook" },
                { Icon: Youtube, href: SOCIAL_LINKS.youtube, label: "YouTube" },
                { Icon: Twitter, href: SOCIAL_LINKS.twitter, label: "Twitter" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-earth-800 border border-earth-700 flex items-center justify-center text-cream-200/80 hover:text-brand-400 hover:border-brand-500 hover:bg-earth-900 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-serif font-semibold text-cream-100 mb-4 text-sm tracking-wide uppercase">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-200/80 hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-earth-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Phone className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-cream-200/60 uppercase tracking-wide">Call Us</p>
                <a href={`tel:${SUPPORT_PHONE}`} className="text-sm text-cream-100 hover:text-brand-400 transition-colors">
                  {SUPPORT_PHONE}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Mail className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-cream-200/60 uppercase tracking-wide">Email Us</p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-cream-100 hover:text-brand-400 transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-cream-200/60 uppercase tracking-wide">Location</p>
                <p className="text-sm text-cream-100">{BRAND_ADDRESS}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-earth-800 bg-earth-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream-200/70">
            <p>
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved. Made with ❤️ in Bihar.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span>
                FSSAI Reg. No.{" "}
                <span className="text-cream-100 font-medium tabular-nums">{FSSAI_REGISTRATION_NUMBER}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>Secure online payments</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-cream-200">Razorpay · UPI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
