"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactSchema, type ContactInput } from "@/lib/validations/review";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactInput) => {
    setServerError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setServerError(json.message ?? "Failed to send message. Try again.");
      return;
    }
    setSubmitted(true);
  };

  const contactItems = [
    { icon: MapPin, title: "Address", value: "Rajendra Nagar, Patna, Bihar 800016" },
    { icon: Phone, title: "Phone", value: "+91 98765 43210" },
    { icon: Mail, title: "Email", value: "hello@magadhrecipe.com" },
    { icon: Clock, title: "Hours", value: "Mon–Sat: 9 AM – 6 PM IST" },
  ];

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-earth-dark">Get in Touch</h1>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">
            Have a question, bulk order inquiry, or just want to say hello? We&apos;d love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Info */}
          <div className="space-y-6">
            {contactItems.map(({ icon: Icon, title, value }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-earth-dark text-sm">{title}</p>
                  <p className="text-gray-600 text-sm mt-0.5">{value}</p>
                </div>
              </div>
            ))}

            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
              <p className="font-semibold text-earth-dark mb-2 text-sm">Bulk & Corporate Orders</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ordering more than 50 packs? We offer exclusive bulk discounts for weddings,
                corporate gifting, and festive hampers. Contact us for a custom quote.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-earth-dark mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm">
                  Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h2 className="font-serif text-lg font-bold text-earth-dark mb-4">Send a Message</h2>
                {serverError && (
                  <div className="text-sm text-spice-700 bg-spice-50 border border-spice-200 rounded-xl px-4 py-3">
                    {serverError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Your Name" error={errors.name?.message} {...register("name")} />
                  <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
                </div>
                <Input label="Phone (optional)" type="tel" {...register("phone")} />
                <Input label="Subject" error={errors.subject?.message} {...register("subject")} />
                <div>
                  <label className="block text-sm font-medium text-earth-dark mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-earth-dark focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    {...register("message")}
                  />
                  {errors.message && <p className="text-xs text-spice-600 mt-1">{errors.message.message}</p>}
                </div>
                <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
