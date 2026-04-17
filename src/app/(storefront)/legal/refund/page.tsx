import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_PHONE, FSSAI_REGISTRATION_NUMBER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Food safety, orders & product support | Magadh Recipe",
  description:
    "How we handle food products, quality issues, and support. Magadh Recipe does not offer general returns on opened food items.",
};

export default function ProductSupportPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-earth-dark mb-2">
        Food safety, orders &amp; product support
      </h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 2026</p>
      <div className="prose-brand space-y-6 text-sm text-gray-700 leading-relaxed">
        <p>
          We sell handcrafted, perishable food products. For safety and hygiene reasons,{" "}
          <strong>we do not accept general returns or exchanges</strong> once jars have been opened or
          used, and we do not operate a standard &ldquo;change of mind&rdquo; return service.
        </p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Damaged, leaking, or wrong item</h2>
        <p>
          If your order arrives damaged, leaking, or with the wrong product, please contact us within{" "}
          <strong>48 hours of delivery</strong> with your order number and clear photos of the outer
          packaging and the product. We will review each case and may offer a replacement or refund at
          our discretion, in line with applicable law.
        </p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Cancellations</h2>
        <p>
          If you need to cancel an order, write to us as soon as possible. Once an order is packed or
          handed to the courier, cancellation may not be possible. Approved cancellations for prepaid
          orders are refunded to the original payment method, subject to processing times from the
          payment provider.
        </p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">FSSAI registration</h2>
        <p>
          Magadh Recipe operates in compliance with the Food Safety and Standards Act, 2006.{" "}
          <strong>FSSAI registration number:</strong>{" "}
          <span className="tabular-nums">{FSSAI_REGISTRATION_NUMBER}</span>
        </p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Contact</h2>
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 hover:text-brand-700 font-medium">
            {SUPPORT_EMAIL}
          </a>
          {" · "}
          <a href={`tel:${SUPPORT_PHONE}`} className="text-brand-600 hover:text-brand-700 font-medium">
            {SUPPORT_PHONE}
          </a>
          {" · "}
          <Link href="/contact" className="text-brand-600 hover:text-brand-700 font-medium">
            Contact form
          </Link>
        </p>
      </div>
    </div>
  );
}
