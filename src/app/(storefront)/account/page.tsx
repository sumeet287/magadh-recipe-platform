"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail, Phone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth";

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      phone: (session?.user as { phone?: string })?.phone ?? "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setServerError(null);
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      setServerError(json.message ?? "Failed to update profile.");
      return;
    }

    await update({ name: data.name });
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
          {...register("phone")}
        />

        <Button type="submit" loading={isSubmitting} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </form>
    </div>
  );
}
