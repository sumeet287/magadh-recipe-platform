"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Phone, Save, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth";

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      phone: session?.user?.phone ?? "",
      marketingOptIn: session?.user?.marketingOptIn ?? false,
    },
  });

  const optIn = watch("marketingOptIn");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/users/profile");
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data;
        if (cancelled || !data) return;
        reset({
          name: data.name ?? "",
          phone: data.phone ?? "",
          marketingOptIn: Boolean(data.marketingOptIn),
        });
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (data: UpdateProfileInput) => {
    setServerError(null);
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? json.message ?? "Failed to update profile.");
      return;
    }

    await update({
      name: data.name,
      phone: data.phone ?? null,
      marketingOptIn: data.marketingOptIn ?? false,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-xl font-bold text-earth-dark">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
        {serverError && (
          <div className="text-sm text-spice-700 bg-spice-50 border border-spice-200 rounded-xl px-4 py-3">
            {serverError}
          </div>
        )}

        {saved && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            ✓ Profile updated successfully!
          </div>
        )}

        <Input
          label="Full Name"
          leftIcon={<User className="w-4 h-4 text-gray-400" />}
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email"
          type="email"
          value={session?.user?.email ?? ""}
          leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
          disabled
          hint="Email cannot be changed"
        />

        <Input
          label="Phone"
          type="tel"
          placeholder="10-digit mobile number"
          leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
          error={errors.phone?.message}
          hint="We'll send order updates and offers via WhatsApp"
          {...register("phone")}
        />

        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-cream-50 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(optIn)}
            onChange={(e) => setValue("marketingOptIn", e.target.checked, { shouldDirty: true })}
            className="mt-0.5 rounded text-brand-500 focus:ring-brand-500"
            disabled={!loaded}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-brand-500" />
              <p className="text-sm font-medium text-earth-dark">WhatsApp Offers &amp; Updates</p>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Get exclusive offers, new product launches, and recipe tips on WhatsApp.
              You can opt out anytime.
            </p>
          </div>
        </label>

        <Button type="submit" loading={isSubmitting} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </form>
    </div>
  );
}
