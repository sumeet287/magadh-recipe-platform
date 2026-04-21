"use client";

import { useState } from "react";
import { Loader2, Bell, CheckCircle2, AlertCircle } from "lucide-react";

interface ResendNotificationButtonProps {
  orderId: string;
}

type Feedback = { type: "success" | "error"; message: string } | null;

export function ResendNotificationButton({ orderId }: ResendNotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleResend() {
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notify`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error ?? "Failed to resend notification",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: `Admin email + WhatsApp re-sent for #${data.orderNumber}`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <h2 className="text-white font-semibold text-sm mb-2">
        Admin Notifications
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Re-send the admin email and WhatsApp for this order. Customer email will
        not be sent.
      </p>

      <button
        type="button"
        onClick={handleResend}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-600 border border-gray-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {isLoading ? "Sending..." : "Resend Admin Notification"}
      </button>

      {feedback?.type === "success" && (
        <div className="mt-3 flex items-start gap-2 text-sm text-green-400 bg-green-900/20 border border-green-900/30 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {feedback?.type === "error" && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
