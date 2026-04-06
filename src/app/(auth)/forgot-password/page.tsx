"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });

    if (!res.ok) {
      const json = await res.json();
      setServerError(json.message ?? "Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-earth-dark mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          We&apos;ve sent a password reset link to{" "}
          <strong className="text-earth-dark">{getValues("email")}</strong>.
          Check your inbox (and spam folder, just in case).
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-brand-600 font-medium hover:text-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-earth-dark">Forgot password?</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="text-sm text-spice-700 bg-spice-50 border border-spice-200 rounded-xl px-4 py-3">
            {serverError}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Send Reset Link
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-earth-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
