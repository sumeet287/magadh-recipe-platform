import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/og-defaults";

export const metadata: Metadata = {
  title: "Shop Premium Pickles & Achars Online | Magadh Recipe",
  description:
    "Browse our collection of authentic handcrafted pickles, achars & masalas from Bihar. Filter by category, spice level & price. Free shipping above ₹499.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Shop Premium Pickles & Achars | Magadh Recipe",
    description:
      "Handcrafted pickles, achars & masalas from Bihar. Filter by taste & spice. Free shipping above ₹499.",
    url: "/products",
    images: [{ url: DEFAULT_OG_IMAGE_PATH, alt: "Magadh Recipe shop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Premium Pickles & Achars | Magadh Recipe",
    description: "Browse handcrafted pickles & achars from Bihar. Free shipping above ₹499.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return children;
}
