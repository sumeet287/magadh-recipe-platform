import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy | Magadh Recipe",
  description: "Learn about Magadh Recipe shipping rates, delivery timelines, packaging, and pan-India coverage.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-earth-dark mb-2">Shipping Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 2026</p>
      <div className="prose-brand space-y-6 text-sm text-gray-700 leading-relaxed">

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Delivery Coverage</h2>
        <p>We deliver across India. Our pickles are carefully packed and shipped via trusted courier partners to ensure they reach you in perfect condition.</p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Shipping Charges</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Free Shipping</strong> on orders above ₹499</li>
          <li><strong>Standard Shipping:</strong> ₹99 for orders below ₹499</li>
        </ul>
        <p className="text-gray-600">We accept online payment only (no cash on delivery).</p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Estimated Delivery Time</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Metro Cities</strong> (Delhi, Mumbai, Bangalore, etc.): 3-5 business days</li>
          <li><strong>Tier-2 Cities:</strong> 5-7 business days</li>
          <li><strong>Remote Areas:</strong> 7-10 business days</li>
        </ul>
        <p>Please note that delivery times may vary during festive seasons, natural calamities, or unforeseen circumstances. We will keep you informed of any delays via email.</p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Order Processing</h2>
        <p>Orders are processed within 24-48 hours of confirmation (excluding Sundays and public holidays). You will receive an email with tracking details once your order is shipped.</p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Packaging</h2>
        <p>All our products are packed in food-grade, leak-proof packaging with additional bubble wrap and corrugated boxes for protection. Glass jars are double-wrapped to prevent breakage during transit.</p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Order Tracking</h2>
        <p>Once shipped, you will receive a tracking number and link via email. You can also track your order from the <Link href="/account/orders" className="text-brand-600 hover:text-brand-700 font-medium">My Orders</Link> section of your account.</p>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Undelivered / Failed Delivery</h2>
        <p>If a delivery attempt fails due to incorrect address, unavailability, or refusal:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The courier partner will attempt delivery up to 2 additional times</li>
          <li>After 3 failed attempts, the shipment may be returned to us</li>
          <li>For prepaid orders, any eligible refund is handled case-by-case after deducting applicable return shipping charges</li>
        </ul>

        <h2 className="font-serif font-semibold text-earth-dark text-lg">Contact Us</h2>
        <p>For any shipping-related queries, reach out to us at <a href="mailto:magadhrecipe@gmail.com" className="text-brand-600 hover:text-brand-700 font-medium">magadhrecipe@gmail.com</a> or call us at +91 620-719-7364.</p>
      </div>
    </div>
  );
}
