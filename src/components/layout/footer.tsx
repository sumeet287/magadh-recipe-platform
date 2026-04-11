import Link from "next/link";
import { Instagram, Facebook, Youtube, Twitter, Phone, Mail, MapPin } from "lucide-react";
import { APP_NAME, SOCIAL_LINKS, SUPPORT_EMAIL, SUPPORT_PHONE, BRAND_ADDRESS } from "@/lib/constants";

const footerLinks = {
  "Quick Links": [
    { label: "Home", href: "/" },
    { label: "All Products", href: "/products" },
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
    { label: "Refund Policy", href: "/legal/refund" },
    { label: "Shipping Policy", href: "/legal/shipping" },
    { label: "FAQ", href: "/contact#faq" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-earth-dark text-cream-200">
      {/* Main Footer */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <div>
                <div className="font-serif font-bold text-cream-100 text-lg leading-none">
                  {APP_NAME}
                </div>
                <div className="text-[10px] text-brand-400 font-medium tracking-wider leading-none mt-0.5">
                  माँ के हाथ का स्वाद
                </div>
              </div>
            </Link>

            <p className="text-sm text-earth-300 leading-relaxed mb-6 max-w-xs">
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
                  className="w-9 h-9 rounded-lg bg-earth-800 border border-earth-700 flex items-center justify-center text-earth-300 hover:text-brand-400 hover:border-brand-500 hover:bg-earth-900 transition-all"
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
                      className="text-sm text-earth-300 hover:text-brand-400 transition-colors"
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
                <p className="text-[11px] text-earth-400 uppercase tracking-wide">Call Us</p>
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
                <p className="text-[11px] text-earth-400 uppercase tracking-wide">Email Us</p>
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
                <p className="text-[11px] text-earth-400 uppercase tracking-wide">Location</p>
                <p className="text-sm text-cream-100">{BRAND_ADDRESS}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-earth-800 bg-earth-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-earth-400">
            <p>
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved. Made with ❤️ in Bihar.
            </p>
            <div className="flex items-center gap-4">
              <span>FSSAI Certified</span>
              <span>•</span>
              <span>Secure Payments</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span>We accept:</span>
                <span className="text-cream-200">Razorpay • UPI • COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
