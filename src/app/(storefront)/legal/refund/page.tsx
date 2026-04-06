import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund & Return Policy | Magadh Recipe" };

export default function RefundPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-earth-dark mb-2">Refund & Return Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: January 2025</p>
      <div className="prose-brand space-y-6 text-sm text-gray-700 leading-relaxed">
        <p>We want you to be completely satisfied with your purchase. If you&apos;re not, we&apos;re here to help.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Return Policy</h2>
        <p>You have 7 days from the date of delivery to request a return. Items must be:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Unopened and in original sealed packaging</li>
          <li>In resalable condition</li>
          <li>Returned with proof of purchase</li>
        </ul>
        <p>Products that have been opened or partially consumed are not eligible for returns unless there is a quality issue.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Refund Process</h2>
        <p>Once we receive and inspect the returned items, we will process your refund within 5–7 business days. Refunds will be credited to the original payment method:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Online payments: Refunded to original card/account within 5–7 business days</li>
          <li>Cash on Delivery: Refunded via bank transfer within 7–10 business days</li>
        </ul>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Damaged or Wrong Products</h2>
        <p>If you received a damaged, defective, or wrong product, please contact us within 48 hours of delivery with photos. We will arrange a replacement or full refund at no additional cost to you.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Non-Returnable Items</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Opened/used products</li>
          <li>Products past their expiry date</li>
          <li>Items purchased during clearance sales (unless defective)</li>
        </ul>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">How to Initiate a Return</h2>
        <p>Contact us at returns@magadhrecipe.com or call +91 98765 43210 with your order number and reason for return. We&apos;ll guide you through the process.</p>
      </div>
    </div>
  );
}
