import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/providers/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Magadh Recipe — Premium Pickles & Regional Food",
    template: "%s | Magadh Recipe",
  },
  description:
    "Premium handcrafted pickles, masalas, and regional food products from the heart of Bihar. Authentic, natural, and gift-worthy.",
  keywords: [
    "pickle",
    "achar",
    "mango pickle",
    "bihari food",
    "regional food",
    "masala",
    "magadh",
    "india",
    "homemade pickle",
    "premium pickle",
  ],
  authors: [{ name: "Magadh Recipe" }],
  creator: "Magadh Recipe",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Magadh Recipe",
    title: "Magadh Recipe — Premium Pickles & Regional Food",
    description:
      "Handcrafted pickles and regional food products from Bihar. Pure ingredients, traditional recipes.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Magadh Recipe — आचार की असली पहचान",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magadh Recipe",
    description: "Premium handcrafted pickles from Bihar.",
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-cream-100 text-earth-dark`}
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
