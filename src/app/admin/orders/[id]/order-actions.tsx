"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { Loader2, Send } from "lucide-react";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "RETURN_REQUESTED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "REFUND_INITIATED"],
  RETURNED: ["REFUND_INITIATED"],
  REFUND_INITIATED: ["REFUNDED"],
};

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
  hasShiprocket?: boolean;
}

export function OrderActions({ orderId, currentStatus, hasShiprocket }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [courier, setCourier] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  const showTrackingFields = status === "SHIPPED";

  if (allowedStatuses.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <h2 className="text-white font-semibold text-sm mb-2">
          Update Status
        </h2>
        <p className="text-sm text-gray-500">
          No further status transitions available for this order.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!status) {
      setError("Please select a status");
      return;
    }

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          note: note || undefined,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          courier: courier || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? data.message ?? "Failed to update order");
        return;
      }

      setSuccess(`Order updated to ${ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG]?.label ?? status}`);
      setStatus("");
      setNote("");
      setTrackingNumber("");
      setTrackingUrl("");
      setCourier("");

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <h2 className="text-white font-semibold text-sm mb-4">Update Status</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Select */}
        <div>
          <label
            htmlFor="status"
            className="block text-xs text-gray-400 font-medium mb-1.5"
          >
            New Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">Select status...</option>
            {allowedStatuses.map((s) => {
              const config =
                ORDER_STATUS_CONFIG[s as keyof typeof ORDER_STATUS_CONFIG];
              return (
                <option key={s} value={s}>
                  {config?.label ?? s}
                </option>
              );
            })}
          </select>
        </div>

        {status === "PROCESSING" && !hasShiprocket && (
          <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
            <p className="text-xs text-purple-400">
              Shiprocket order will be auto-created when you move to Processing. AWB and courier will be assigned automatically.
            </p>
          </div>
        )}

        {/* Tracking fields — only shown if Shiprocket is NOT handling shipping */}
        {showTrackingFields && !hasShiprocket && (
          <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <p className="text-xs text-gray-400 font-medium">
              Shipping Details
            </p>
            <div>
              <label
                htmlFor="trackingNumber"
                className="block text-xs text-gray-500 mb-1"
              >
                Tracking Number
              </label>
              <input
                id="trackingNumber"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. AWB1234567890"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="trackingUrl"
                className="block text-xs text-gray-500 mb-1"
              >
                Tracking URL
              </label>
              <input
                id="trackingUrl"
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="courier"
                className="block text-xs text-gray-500 mb-1"
              >
                Courier
              </label>
              <input
                id="courier"
                type="text"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                placeholder="e.g. Delhivery, BlueDart"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label
            htmlFor="note"
            className="block text-xs text-gray-400 font-medium mb-1.5"
          >
            Note (optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Internal note about this status change..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Error / Success messages */}
        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-400 bg-green-900/20 border border-green-900/30 rounded-lg px-3 py-2">
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !status}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isPending ? "Updating..." : "Update Order Status"}
        </button>
      </form>
    </div>
  );
}
