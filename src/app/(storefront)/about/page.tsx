import type { Metadata } from "next";
import { BRAND_STORY, WHY_CHOOSE_US } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us — A Mother's Kitchen, Your Table | Magadh Recipe",
  description: "The Magadh Recipe story — born from a mother's kitchen in Patna, Bihar. Discover how authentic family recipes became India's most-loved premium pickle brand. No preservatives, handcrafted with love.",
  openGraph: {
    title: "About Magadh Recipe — Born from Maa's Kitchen in Bihar",
    description: "A mother's treasured recipes, now reaching 50,000+ happy families across India. Discover our story of love, tradition, and authentic flavours.",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-cream-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-earth-dark via-brand-900 to-earth-dark text-white py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-brand-300 text-sm font-medium tracking-widest uppercase mb-4">Our Story</p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight">
            A Mother&apos;s Love,<br />in Every Jar
          </h1>
          <p className="text-white/75 text-lg leading-relaxed max-w-2xl mx-auto">
            We&apos;re a family-run food brand born in Patna, Bihar — carrying forward Maa&apos;s treasured recipes to preserve the
            authentic taste of traditional Bihari pickles, spices, and heritage condiments.
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-20">
        <div className="prose-brand max-w-none space-y-6">
          {BRAND_STORY.paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12">
          {BRAND_STORY.stats.map(({ value, label }) => (
            <div key={label} className="text-center bg-white rounded-2xl p-5 shadow-card">
              <p className="font-serif text-3xl font-bold text-brand-600">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-earth-dark text-center mb-10">
            Why Our Customers Love Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE_US.map(({ icon, title, body }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-cream-50 border border-cream-200">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-earth-dark mb-1">{title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
