"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (data: SignUpInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone, password: data.password }),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.message ?? json.error ?? "Registration failed. Please try again.");
      return;
    }

    setRegisteredEmail(data.email);
  };

  const handleResend = async () => {
    if (!registeredEmail || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      if (res.ok) {
        setResendSuccess(true);
      }
    } catch {
      // Silently fail — the user can try again
    } finally {
      setResendLoading(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <div className="mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-earth-dark">Check your email!</h1>
          <p className="text-gray-500 text-sm mt-2">
            We&apos;ve sent a verification link to{" "}
            <span className="font-medium text-earth-dark">{registeredEmail}</span>
          </p>
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-4 mb-6">
          <p className="text-sm text-earth-dark">
            Click the link in your email to verify your account. The link expires in 24 hours.
          </p>
        </div>

        {resendSuccess && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            Verification email resent successfully!
          </div>
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-full mb-3"
          onClick={handleResend}
          loading={resendLoading}
        >
          Resend verification email
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already verified?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-earth-dark">Create account</h1>
        <p className="text-gray-500 text-sm mt-1">Join Magadh Recipe for exclusive offers</p>
      </div>

      {/* Google Sign Up */}
      <Button
        variant="outline"
        size="lg"
        className="w-full mb-6"
        onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/" }); }}
        loading={googleLoading}
        type="button"
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or register with email</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="text-sm text-spice-700 bg-spice-50 border border-spice-200 rounded-xl px-4 py-3">
            {serverError}
          </div>
        )}

        <Input
          label="Full Name"
          placeholder="Your full name"
          leftIcon={<User className="w-4 h-4 text-gray-400" />}
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="10-digit mobile number"
          leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Minimum 8 characters"
          leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Confirm Password"
          type={showConfirm ? "text" : "password"}
          placeholder="Repeat your password"
          leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
          rightIcon={
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <p className="text-xs text-gray-400">
          By creating an account, you agree to our{" "}
          <Link href="/legal/terms" className="text-brand-600 hover:underline">Terms</Link> and{" "}
          <Link href="/legal/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
        </p>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
