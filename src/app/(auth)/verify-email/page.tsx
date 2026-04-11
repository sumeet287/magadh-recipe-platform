"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage("Invalid verification link. Missing token or email.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
        );
        const json = await res.json();

        if (res.ok && json.success) {
          setStatus("success");
          setTimeout(() => router.push("/login?verified=true"), 3000);
        } else {
          setStatus("error");
          setErrorMessage(json.error ?? "Verification failed. Please try again.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [token, email, router]);

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      {status === "loading" && (
        <div className="space-y-4">
          <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto" />
          <h1 className="font-serif text-2xl font-bold text-earth-dark">Verifying your email...</h1>
          <p className="text-gray-500 text-sm">Please wait while we verify your email address.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <h1 className="font-serif text-2xl font-bold text-earth-dark">Email Verified!</h1>
          <p className="text-gray-500 text-sm">
            Your email has been verified successfully. Redirecting you to sign in...
          </p>
          <Button onClick={() => router.push("/login?verified=true")} size="lg" className="w-full">
            Sign In Now
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <XCircle className="w-12 h-12 text-spice-600 mx-auto" />
          <h1 className="font-serif text-2xl font-bold text-earth-dark">Verification Failed</h1>
          <p className="text-gray-500 text-sm">{errorMessage}</p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/login")} size="lg" className="w-full">
              Go to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/signup")}
              size="lg"
              className="w-full"
            >
              Create New Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
