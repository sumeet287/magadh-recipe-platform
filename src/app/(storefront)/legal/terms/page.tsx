import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service | Magadh Recipe" };

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-earth-dark mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: January 2025</p>
      <div className="prose-brand space-y-6 text-sm text-gray-700 leading-relaxed">
        <p>By accessing and using the Magadh Recipe website, you accept and agree to be bound by the terms and provisions of this agreement.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Use of the Site</h2>
        <p>You may use our site for lawful purposes only. You agree not to use the site in any way that violates applicable laws or regulations, is harmful, fraudulent, or infringes on the rights of others.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Orders & Payments</h2>
        <p>All orders are subject to availability. We reserve the right to refuse or cancel any order if we suspect fraud or unauthorized activity. Prices are in Indian Rupees (INR) and include applicable GST.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Intellectual Property</h2>
        <p>All content on this website, including text, graphics, logos, images, and software, is the property of Magadh Recipe and is protected by applicable intellectual property laws.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Limitation of Liability</h2>
        <p>Magadh Recipe shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our website or products.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Governing Law</h2>
        <p>These terms shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the jurisdiction of courts in Patna, Bihar.</p>
        <h2 className="font-serif font-semibold text-earth-dark text-lg">Contact</h2>
        <p>Questions about the Terms of Service may be sent to legal@magadhrecipe.com.</p>
      </div>
    </div>
  );
}
