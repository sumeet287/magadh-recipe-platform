import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | Magadh Recipe" };

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-earth-dark mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: January 2025</p>
      <div className="prose-brand space-y-6 text-sm text-gray-700 leading-relaxed">
        <p>Magadh Recipe (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal information and your right to privacy.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact us. This includes your name, email address, phone number, shipping address, and payment information (processed securely via Razorpay).</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To process and fulfill your orders</li>
          <li>To send you order confirmations and shipping updates</li>
          <li>To respond to your customer service requests</li>
          <li>To send promotional communications (with your consent)</li>
          <li>To improve our website and services</li>
        </ul>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Data Security</h2>
        <p>We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Passwords are hashed using industry-standard algorithms and are never stored in plain text.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Data Sharing</h2>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except to trusted partners who assist us in operating our website, conducting our business, or serving you, as long as those parties agree to keep this information confidential.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us at privacy@magadhrecipe.com.</p>
      </div>
    </div>
  );
}
