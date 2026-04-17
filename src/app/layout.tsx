import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cormorant",
  display: "swap",
  adjustFontFallback: true,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Magadh Recipe — Maa ke Haath ka Swaad | Premium Handcrafted Pickles from Bihar",
    template: "%s | Magadh Recipe — Premium Pickles & Regional Food",
  },
  description:
    "Discover Magadh Recipe — premium handcrafted pickles, achars, masalas & regional food born from a mother's kitchen in Bihar. No preservatives, cold-pressed mustard oil, authentic family recipes passed down through generations. Free delivery across India above ₹499.",
  keywords: [
    "magadh recipe",
    "premium pickle",
    "achar",
    "mango pickle",
    "aam ka achar",
    "bihari pickle",
    "bihari food",
    "homemade pickle online",
    "traditional indian pickle",
    "masala",
    "spices",
    "bihar",
    "patna",
    "magadh",
    "handcrafted pickle",
    "no preservative pickle",
    "mustard oil pickle",
    "gift hamper",
    "diwali gift",
    "authentic indian food",
    "buy pickle online india",
    "mother recipe",
    "ghar ka achar",
  ],
  authors: [{ name: "Magadh Recipe" }],
  creator: "Magadh Recipe",
  publisher: "Magadh Recipe",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Magadh Recipe",
    title: "Magadh Recipe — Maa ke Haath ka Swaad | Premium Pickles from Bihar",
    description:
      "Born from a mother's kitchen in Bihar — premium handcrafted pickles, achars & masalas. 50,000+ happy customers. No preservatives, pure ingredients, FSSAI certified. Free shipping above ₹499.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Magadh Recipe — आचार की असली पहचान | Premium Handcrafted Pickles from Bihar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magadh Recipe — Premium Handcrafted Pickles from Bihar",
    description: "Born from a mother's kitchen — authentic pickles, achars & masalas. 50K+ happy customers. No preservatives. Free shipping above ₹499.",
    images: ["/images/og-image.jpg"],
    creator: "@magadhrecipe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: "food",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} font-sans antialiased bg-cream-100 text-earth-dark`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  );
}
