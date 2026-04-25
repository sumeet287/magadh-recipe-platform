"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Plus, Loader2, Check, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/store/ui-store";

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

interface Form {
  name: string;
  templateName: string;
  templateLanguage: string;
  params: string;
  optedInOnly: boolean;
  includeUnverifiedPhone: boolean;
  limit: string;
}

const EMPTY_FORM: Form = {
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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
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

  useEffect(() => {
    if (!showModal) return;
    let cancelled = false;
    setAudienceLoading(true);
    const qs = new URLSearchParams({
      optedInOnly: String(form.optedInOnly),
      includeUnverifiedPhone: String(form.includeUnverifiedPhone),
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
  }, [showModal, form.optedInOnly, form.includeUnverifiedPhone]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setAudienceCount(null);
    setShowModal(true);
  };

  const parsedParams = useMemo(() => {
    return form.params
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [form.params]);

  const submit = async () => {
    if (!form.name.trim() || !form.templateName.trim()) {
      addToast({ type: "error", message: "Name and template are required" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          templateName: form.templateName.trim(),
          templateLanguage: form.templateLanguage.trim() || "en",
          templateParams: parsedParams,
          audience: {
            optedInOnly: form.optedInOnly,
            includeUnverifiedPhone: form.includeUnverifiedPhone,
            limit: form.limit ? Number(form.limit) : undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to create broadcast");
      addToast({ type: "success", message: "Broadcast queued. Sending starts within ~5 min." });
      setShowModal(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-400" />
            WhatsApp Broadcasts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Send approved WhatsApp templates to opted-in users. Messages go out in the background.
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Broadcast
        </Button>
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
                  <span className="text-[10px] text-gray-500 ml-1">({b.templateLanguage})</span>
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
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(b.createdAt)}</td>
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

      <Modal
        isOpen={showModal}
        onClose={() => !submitting && setShowModal(false)}
        title="New WhatsApp Broadcast"
        description="Send an approved template to opted-in users."
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Campaign name (internal)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. New Arrivals — May 2026"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Meta template name"
                value={form.templateName}
                onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                placeholder="e.g. new_product_launch"
                hint="Must be approved in Meta Business Manager"
              />
            </div>
            <Input
              label="Language"
              value={form.templateLanguage}
              onChange={(e) => setForm({ ...form, templateLanguage: e.target.value })}
              placeholder="en"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Template parameters (one per line — in order of {"{{1}}, {{2}}…"})
            </label>
            <textarea
              value={form.params}
              onChange={(e) => setForm({ ...form, params: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none font-mono"
              placeholder={"Magadh Recipe\nNew Gud Amla Pickle"}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
              Audience
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.optedInOnly}
                onChange={(e) => setForm({ ...form, optedInOnly: e.target.checked })}
              />
              Opted-in users only (recommended)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.includeUnverifiedPhone}
                onChange={(e) =>
                  setForm({ ...form, includeUnverifiedPhone: e.target.checked })
                }
              />
              Include unverified phone numbers
            </label>
            <Input
              label="Limit (optional)"
              type="number"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
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
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="premium"
              className="flex-1"
              onClick={submit}
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
