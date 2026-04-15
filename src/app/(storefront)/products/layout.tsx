import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Shop Premium Pickles & Achars Online | Magadh Recipe",
  description:
    "Browse our collection of authentic handcrafted pickles, achars & masalas from Bihar. Filter by category, spice level & price. Free shipping above ₹499.",
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return children;
}
