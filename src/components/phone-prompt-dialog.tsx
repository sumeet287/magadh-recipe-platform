"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Phone, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const DISMISS_COOLDOWN_DAYS = 3;
const SESSION_SHOWN_KEY = "mr:phone-prompt-shown";

type ProfileData = {
  phone: string | null;
  marketingOptIn: boolean;
  phonePromptDismissedAt: string | null;
};

type PromptMode = "phone-missing" | "optin-missing";

const PHONE_REGEX = /^[6-9]\d{9}$/;

function maskPhone(phone: string | null): string {
  if (!phone) return "";
  const last10 = phone.replace(/\D/g, "").slice(-10);
  if (last10.length < 10) return phone;
  return `+91 ${last10.slice(0, 2)}${"X".repeat(5)}${last10.slice(-3)}`;
}

export function PhonePromptDialog() {
  const { data: session, update, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PromptMode>("phone-missing");
  const [existingPhone, setExistingPhone] = useState<string | null>(null);
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

        const needsPhone = !data.phone;
        const needsOptIn = Boolean(data.phone) && !data.marketingOptIn;
        if (!needsPhone && !needsOptIn) return;

        if (data.phonePromptDismissedAt) {
          const dismissedAt = new Date(data.phonePromptDismissedAt).getTime();
          const threshold = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
          if (Date.now() - dismissedAt < threshold) return;
        }

        setMode(needsPhone ? "phone-missing" : "optin-missing");
        setExistingPhone(data.phone);
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

  const maskedPhone = useMemo(() => maskPhone(existingPhone), [existingPhone]);

  const handleSubmit = async () => {
    setError(null);

    if (mode === "phone-missing" && !PHONE_REGEX.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number (starts with 6-9).");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> =
        mode === "phone-missing"
          ? { phone, marketingOptIn: optIn }
          : { marketingOptIn: true };

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? json?.message ?? "Could not save. Please try again.");
        setSubmitting(false);
        return;
      }

      await update(
        mode === "phone-missing"
          ? { phone, marketingOptIn: optIn }
          : { marketingOptIn: true }
      );
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
      <div className="relative -m-6 p-6 sm:p-8 bg-gradient-to-br from-brand-50 to-cream-50">
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing || submitting}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-10">
          <div className="w-11 h-11 rounded-full bg-brand-500/15 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-earth-dark leading-tight">
              {mode === "phone-missing"
                ? "Update Your Mobile Number"
                : "Get Exclusive WhatsApp Offers"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === "phone-missing"
                ? "So you never miss order updates or offers"
                : "Early access to new launches & festive deals"}
            </p>
          </div>
        </div>

        {mode === "phone-missing" ? (
          <>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Add your mobile number and we&apos;ll send you order confirmations,
              shipping updates, and exclusive WhatsApp offers.
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
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
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
                  Send me exclusive offers, new product launches, and recipe tips
                  on WhatsApp (you can opt out anytime).
                </span>
              </label>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              We&apos;ll send early access to new product launches, festive
              discounts, and recipe tips straight to your WhatsApp.
            </p>

            <div className="p-3 rounded-xl bg-white/70 border border-brand-100 mb-2">
              <p className="text-xs text-gray-500">We&apos;ll message you on</p>
              <p className="text-sm font-medium text-earth-dark mt-0.5 flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500" />
                {maskedPhone || "your mobile number"}
              </p>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Usually 1-2 messages a month. You can opt out anytime from your
              account settings or by replying STOP.
            </p>

            {error && (
              <p className="text-xs text-spice-700 bg-spice-50 border border-spice-200 rounded-lg px-3 py-2 mt-3">
                {error}
              </p>
            )}
          </>
        )}

        <div className="flex gap-2.5 mt-5">
          <Button
            variant="ghost"
            className="flex-1 text-gray-500"
            onClick={handleDismiss}
            disabled={submitting || dismissing}
          >
            {mode === "phone-missing" ? "Not now" : "No thanks"}
          </Button>
          <Button
            variant="premium"
            className="flex-1"
            onClick={handleSubmit}
            loading={submitting}
            disabled={dismissing}
          >
            {mode === "phone-missing" ? "Save Number" : "Yes, Subscribe"}
          </Button>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-3">
          We&apos;ll never spam. Your number is safe with us.
        </p>
      </div>
    </Modal>
  );
}
