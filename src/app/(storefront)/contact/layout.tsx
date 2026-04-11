import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact Us | Magadh Recipe",
  description:
    "Have a question or need help? Reach out to Magadh Recipe. We're here to help with orders, shipping, custom requests & more.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
