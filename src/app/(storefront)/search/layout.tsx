import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Search Products | Magadh Recipe",
  description: "Search for your favourite pickles, achars, masalas and more from Magadh Recipe.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
