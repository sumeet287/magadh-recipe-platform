"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Phone, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const DISMISS_COOLDOWN_DAYS = 7;
const SESSION_SHOWN_KEY = "mr:phone-prompt-shown";

type ProfileData = {
  phone: string | null;
  marketingOptIn: boolean;
  phonePromptDismissedAt: string | null;
};

const PHONE_REGEX = /^[6-9]\d{9}$/;

export function PhonePromptDialog() {
  const { data: session, update, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (pathname?.startsWith("/admin")) return;
    if (pathname?.startsWith("/checkout")) return;
    if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_SHOWN_KEY)) return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/users/profile");
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data as ProfileData | undefined;
        if (cancelled || !data) return;
        if (data.phone) return;

        if (data.phonePromptDismissedAt) {
          const dismissedAt = new Date(data.phonePromptDismissedAt).getTime();
          const threshold = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
          if (Date.now() - dismissedAt < threshold) return;
        }

        setOpen(true);
        sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
      } catch {
        // ignore
      }
    };

    const timer = setTimeout(check, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, session?.user?.id, pathname]);

  const handleSubmit = async () => {
    setError(null);
    if (!PHONE_REGEX.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number (starts with 6-9).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, marketingOptIn: optIn }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? json?.message ?? "Could not save. Please try again.");
        setSubmitting(false);
        return;
      }
      await update({ phone, marketingOptIn: optIn });
      setOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await fetch("/api/users/phone-prompt/dismiss", { method: "POST" });
      await update({ phonePromptDismissedAt: new Date().toISOString() });
    } catch {
      // ignore — popup will still close locally
    } finally {
      setOpen(false);
      setDismissing(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleDismiss}
      size="md"
      hideCloseButton
      className="!rounded-3xl"
    >
      <div className="-m-6 p-6 sm:p-8 bg-gradient-to-br from-brand-50 to-cream-50">
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing || submitting}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/60 text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-brand-500/15 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-earth-dark leading-tight">
              Update Your Mobile Number
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Taaki order updates aur offers miss na ho
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Apna mobile number add karein — hum aapko order confirmations, shipping
          updates aur special WhatsApp offers bhejenge.
        </p>

        <div className="space-y-3">
          <Input
            label="Mobile Number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            error={error ?? undefined}
          />

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/70 border border-brand-100 cursor-pointer">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="mt-0.5 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              Send me exclusive offers, new product launches, and recipe tips on WhatsApp
              (you can opt out anytime).
            </span>
          </label>
        </div>

        <div className="flex gap-2.5 mt-5">
          <Button
            variant="ghost"
            className="flex-1 text-gray-500"
            onClick={handleDismiss}
            disabled={submitting || dismissing}
          >
            Baad me
          </Button>
          <Button
            variant="premium"
            className="flex-1"
            onClick={handleSubmit}
            loading={submitting}
            disabled={dismissing}
          >
            Save Number
          </Button>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-3">
          We&apos;ll never spam. Your number is safe with us.
        </p>
      </div>
    </Modal>
  );
}
