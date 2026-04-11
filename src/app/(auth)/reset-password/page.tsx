"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Failed to reset password. The link may have expired.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (!token || !email) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <h1 className="font-serif text-2xl font-bold text-earth-dark mb-2">Invalid Link</h1>
        <p className="text-gray-500 text-sm mb-6">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password">
          <Button size="lg" className="w-full">Request New Link</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-earth-dark mb-2">Password Reset!</h1>
        <p className="text-gray-500 text-sm mb-6">Your password has been updated successfully. You can now sign in with your new password.</p>
        <Link href="/login">
          <Button size="lg" className="w-full">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-earth-dark">Reset Password</h1>
        <p className="text-gray-500 text-sm mt-1">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <input type="hidden" {...register("token")} />

        <Input
          label="New Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter new password"
          leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Confirm Password"
          type={showConfirm ? "text" : "password"}
          placeholder="Confirm new password"
          leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
          rightIcon={
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Reset Password
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Remember your password?{" "}
        <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
