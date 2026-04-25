"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Plus,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
  Sparkles,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/store/ui-store";
import {
  BROADCAST_NAME_PLACEHOLDER,
  DEFAULT_BROADCAST_TEMPLATE_NAME,
} from "@/lib/constants";

interface Broadcast {
  id: string;
  name: string;
  templateName: string;
  templateLanguage: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: "PENDING" | "SENDING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED";
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface QuickForm {
  name: string;
  body: string;
  url: string;
  optedInOnly: boolean;
  includeUnverifiedPhone: boolean;
  limit: string;
}

interface AdvancedForm {
  name: string;
  templateName: string;
  templateLanguage: string;
  params: string;
  optedInOnly: boolean;
  includeUnverifiedPhone: boolean;
  limit: string;
}

const EMPTY_QUICK: QuickForm = {
  name: "",
  body: "",
  url: "https://magadhrecipe.com",
  optedInOnly: true,
  includeUnverifiedPhone: false,
  limit: "",
};

const EMPTY_ADV: AdvancedForm = {
  name: "",
  templateName: "",
  templateLanguage: "en",
  params: "",
  optedInOnly: true,
  includeUnverifiedPhone: false,
  limit: "",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: Broadcast["status"] }) {
  const map: Record<Broadcast["status"], string> = {
    PENDING: "bg-gray-700 text-gray-200",
    SENDING: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    COMPLETED: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    PARTIAL: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    FAILED: "bg-red-500/20 text-red-300 border border-red-500/30",
    CANCELLED: "bg-gray-600 text-gray-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

export default function AdminBroadcastsPage() {
  const { addToast } = useUIStore();
  const [list, setList] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"quick" | "advanced" | null>(null);
  const [quick, setQuick] = useState<QuickForm>(EMPTY_QUICK);
  const [adv, setAdv] = useState<AdvancedForm>(EMPTY_ADV);
  const [submitting, setSubmitting] = useState(false);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/broadcasts?limit=30");
      const json = await res.json();
      setList(Array.isArray(json?.data) ? json.data : []);
    } catch {
      addToast({ type: "error", message: "Failed to load broadcasts" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const activeAudience = useMemo(() => {
    if (mode === "quick") {
      return {
        optedInOnly: quick.optedInOnly,
        includeUnverifiedPhone: quick.includeUnverifiedPhone,
      };
    }
    if (mode === "advanced") {
      return {
        optedInOnly: adv.optedInOnly,
        includeUnverifiedPhone: adv.includeUnverifiedPhone,
      };
    }
    return null;
  }, [mode, quick.optedInOnly, quick.includeUnverifiedPhone, adv.optedInOnly, adv.includeUnverifiedPhone]);

  useEffect(() => {
    if (!activeAudience) return;
    let cancelled = false;
    setAudienceLoading(true);
    const qs = new URLSearchParams({
      optedInOnly: String(activeAudience.optedInOnly),
      includeUnverifiedPhone: String(activeAudience.includeUnverifiedPhone),
    });
    fetch(`/api/admin/broadcasts/audience-preview?${qs.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setAudienceCount(json?.data?.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setAudienceCount(null);
      })
      .finally(() => {
        if (!cancelled) setAudienceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeAudience]);

  const openQuick = () => {
    setQuick(EMPTY_QUICK);
    setAudienceCount(null);
    setMode("quick");
  };

  const openAdvanced = () => {
    setAdv(EMPTY_ADV);
    setAudienceCount(null);
    setMode("advanced");
  };

  const closeModal = () => {
    if (submitting) return;
    setMode(null);
  };

  const parsedAdvancedParams = useMemo(() => {
    return adv.params
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [adv.params]);

  const submitQuick = async () => {
    if (!quick.name.trim()) {
      addToast({ type: "error", message: "Campaign name is required" });
      return;
    }
    if (!quick.body.trim()) {
      addToast({ type: "error", message: "Message body is required" });
      return;
    }
    if (!quick.url.trim()) {
      addToast({ type: "error", message: "URL is required" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quick.name.trim(),
          templateName: DEFAULT_BROADCAST_TEMPLATE_NAME,
          templateLanguage: "en",
          templateParams: [
            BROADCAST_NAME_PLACEHOLDER,
            quick.body.trim(),
            quick.url.trim(),
          ],
          audience: {
            optedInOnly: quick.optedInOnly,
            includeUnverifiedPhone: quick.includeUnverifiedPhone,
            limit: quick.limit ? Number(quick.limit) : undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to create broadcast");
      addToast({
        type: "success",
        message: "Broadcast started — sending now. Refresh to see progress.",
      });
      setMode(null);
      fetchList();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create broadcast",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdvanced = async () => {
    if (!adv.name.trim() || !adv.templateName.trim()) {
      addToast({ type: "error", message: "Name and template are required" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adv.name.trim(),
          templateName: adv.templateName.trim(),
          templateLanguage: adv.templateLanguage.trim() || "en",
          templateParams: parsedAdvancedParams,
          audience: {
            optedInOnly: adv.optedInOnly,
            includeUnverifiedPhone: adv.includeUnverifiedPhone,
            limit: adv.limit ? Number(adv.limit) : undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to create broadcast");
      addToast({
        type: "success",
        message: "Broadcast started — sending now. Refresh to see progress.",
      });
      setMode(null);
      fetchList();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create broadcast",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBroadcast = async (id: string) => {
    if (!confirm("Cancel this pending broadcast? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/broadcasts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      addToast({ type: "success", message: "Broadcast cancelled" });
      fetchList();
    } catch {
      addToast({ type: "error", message: "Could not cancel broadcast" });
    }
  };

  const preview = useMemo(() => {
    const name = "Sumeet";
    const body = quick.body.trim() || "Your message will appear here.";
    const url = quick.url.trim() || "magadhrecipe.com";
    return `Hi ${name}! 🌿\n${body}\nShop now at ${url}`;
  }, [quick.body, quick.url]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-400" />
            WhatsApp Broadcasts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Send approved WhatsApp templates to opted-in users. Messages start
            going out within seconds of clicking send and continue in the
            background until done.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-gray-300"
            onClick={openAdvanced}
          >
            <Settings2 className="w-4 h-4 mr-1.5" /> Advanced
          </Button>
          <Button onClick={openQuick} className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Quick Send
          </Button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-xs uppercase text-gray-400">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Template</th>
              <th className="text-left px-4 py-3 font-semibold">Recipients</th>
              <th className="text-left px-4 py-3 font-semibold">Sent / Failed</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Created</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading…
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  No broadcasts yet. Create your first campaign above.
                </td>
              </tr>
            )}
            {list.map((b) => (
              <tr key={b.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.id.slice(0, 12)}…</p>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  <span className="font-mono text-xs">{b.templateName}</span>
                  <span className="text-[10px] text-gray-500 ml-1">
                    ({b.templateLanguage})
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{b.totalRecipients}</td>
                <td className="px-4 py-3 text-gray-300">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Check className="w-3 h-3" />
                    {b.sentCount}
                  </span>
                  {b.failedCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-300 ml-3">
                      <AlertTriangle className="w-3 h-3" />
                      {b.failedCount}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {formatDate(b.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {b.status === "PENDING" && (
                    <button
                      onClick={() => cancelBroadcast(b.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Send modal */}
      <Modal
        isOpen={mode === "quick"}
        onClose={closeModal}
        title="Quick Broadcast"
        description="Send a marketing message to opted-in users using the marketing_broadcast template."
        size="xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <Input
              label="Campaign name (internal)"
              value={quick.name}
              onChange={(e) => setQuick({ ...quick, name: e.target.value })}
              placeholder="e.g. New Gud Amla Pickle launch"
              hint="Only visible in the admin panel"
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Message body <span className="text-gray-400">({"{{2}}"})</span>
              </label>
              <textarea
                value={quick.body}
                onChange={(e) => setQuick({ ...quick, body: e.target.value })}
                rows={5}
                maxLength={900}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                placeholder={"New Gud Amla Pickle launched! 🥭\nLimited stock at ₹299. Order in 24 hrs for FREE shipping."}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {quick.body.length}/900 characters
              </p>
            </div>

            <Input
              label="Destination URL ({{3}})"
              value={quick.url}
              onChange={(e) => setQuick({ ...quick, url: e.target.value })}
              placeholder="https://magadhrecipe.com"
              hint="Where 'Shop now at …' should take the customer"
            />

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                Audience
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={quick.optedInOnly}
                  onChange={(e) => setQuick({ ...quick, optedInOnly: e.target.checked })}
                />
                Opted-in users only (recommended)
              </label>
              <Input
                label="Limit (optional)"
                type="number"
                value={quick.limit}
                onChange={(e) => setQuick({ ...quick, limit: e.target.value })}
                placeholder="e.g. 50"
                hint="Cap recipients — useful for testing"
              />
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="text-gray-600">Estimated recipients:</span>
                <span className="font-semibold text-gray-900">
                  {audienceLoading
                    ? "…"
                    : audienceCount === null
                    ? "—"
                    : audienceCount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide mb-2">
                WhatsApp preview
              </p>
              <div className="rounded-2xl border border-emerald-200 bg-[#e7f7e5] p-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-wide text-emerald-700/80 mb-2 font-semibold">
                  Magadh Recipe • Business
                </p>
                <pre className="font-sans whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {preview}
                </pre>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                {"{{1}}"} is auto-filled with each recipient&apos;s first name.
              </p>
            </div>

            {audienceCount === 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <strong>No recipients match this audience right now.</strong> Ensure users
                have saved their phone number and opted in via the account page or the popup.
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
          <Button variant="ghost" className="flex-1" onClick={closeModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="premium"
            className="flex-1"
            onClick={submitQuick}
            loading={submitting}
            disabled={!audienceCount || audienceCount === 0}
          >
            Queue Broadcast
          </Button>
        </div>
      </Modal>

      {/* Advanced modal — unchanged flexible form */}
      <Modal
        isOpen={mode === "advanced"}
        onClose={closeModal}
        title="Advanced Broadcast"
        description="Send any approved template with custom parameters."
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Campaign name (internal)"
            value={adv.name}
            onChange={(e) => setAdv({ ...adv, name: e.target.value })}
            placeholder="e.g. New Arrivals — May 2026"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Meta template name"
                value={adv.templateName}
                onChange={(e) => setAdv({ ...adv, templateName: e.target.value })}
                placeholder="e.g. new_product_launch"
                hint="Must be approved in Meta Business Manager"
              />
            </div>
            <Input
              label="Language"
              value={adv.templateLanguage}
              onChange={(e) => setAdv({ ...adv, templateLanguage: e.target.value })}
              placeholder="en"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Template parameters (one per line — in order of {"{{1}}, {{2}}…"})
            </label>
            <textarea
              value={adv.params}
              onChange={(e) => setAdv({ ...adv, params: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none font-mono"
              placeholder={"__CUSTOMER_NAME__\nYour message body\nhttps://magadhrecipe.com"}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Tip: use <code>__CUSTOMER_NAME__</code> as a placeholder — the cron swaps it with each recipient&apos;s first name.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
              Audience
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={adv.optedInOnly}
                onChange={(e) => setAdv({ ...adv, optedInOnly: e.target.checked })}
              />
              Opted-in users only (recommended)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={adv.includeUnverifiedPhone}
                onChange={(e) =>
                  setAdv({ ...adv, includeUnverifiedPhone: e.target.checked })
                }
              />
              Include unverified phone numbers
            </label>
            <Input
              label="Limit (optional)"
              type="number"
              value={adv.limit}
              onChange={(e) => setAdv({ ...adv, limit: e.target.value })}
              placeholder="e.g. 500"
              hint="Cap the number of recipients for testing"
            />
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Estimated recipients:</span>
              <span className="font-semibold text-gray-900">
                {audienceLoading
                  ? "…"
                  : audienceCount === null
                  ? "—"
                  : audienceCount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="premium"
              className="flex-1"
              onClick={submitAdvanced}
              loading={submitting}
              disabled={!audienceCount || audienceCount === 0}
            >
              Queue Broadcast
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
