"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag, Calendar, Percent, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface CouponForm {
  code: string;
  description: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  perUserLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const EMPTY_FORM: CouponForm = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 0,
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  perUserLimit: 1,
  startDate: "",
  endDate: "",
  isActive: true,
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export default function AdminCouponsPage() {
  const { addToast } = useUIStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.data ?? []);
    } catch {
      addToast({ type: "error", message: "Failed to load coupons" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount?.toString() ?? "",
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() ?? "",
      usageLimit: coupon.usageLimit?.toString() ?? "",
      perUserLimit: coupon.perUserLimit,
      startDate: toDateInputValue(coupon.startDate),
      endDate: toDateInputValue(coupon.endDate),
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      addToast({ type: "error", message: "Coupon code is required" });
      return;
    }
    if (form.type !== "FREE_SHIPPING" && form.value <= 0) {
      addToast({ type: "error", message: "Value must be greater than 0" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        code: form.code,
        description: form.description,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: Number(form.perUserLimit),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: form.isActive,
      };

      const res = await fetch("/api/admin/coupons", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error ?? "Failed to save coupon" });
        return;
      }

      addToast({ type: "success", message: editingId ? "Coupon updated" : "Coupon created" });
      setModalOpen(false);
      fetchCoupons();
    } catch {
      addToast({ type: "error", message: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: "success", message: data.message ?? "Coupon deleted" });
        fetchCoupons();
      } else {
        addToast({ type: "error", message: data.error ?? "Failed to delete coupon" });
      }
    } catch {
      addToast({ type: "error", message: "Something went wrong" });
    } finally {
      setDeleteId(null);
    }
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === "PERCENTAGE") return `${coupon.value}%`;
    if (coupon.type === "FIXED") return formatCurrency(coupon.value);
    return "Free Shipping";
  };

  const typeLabel = (type: string) => {
    if (type === "PERCENTAGE") return "Percentage";
    if (type === "FIXED") return "Fixed";
    return "Free Shipping";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Coupons</h1>
          <p className="text-sm text-gray-400 mt-1">{coupons.length} total coupons</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Coupon
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs">
                <th className="text-left px-5 py-3 font-medium">Code</th>
                <th className="text-left px-5 py-3 font-medium">Description</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Value</th>
                <th className="text-left px-5 py-3 font-medium">Usage</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Dates</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          <span className="text-white font-mono font-semibold text-xs tracking-wide">
                            {coupon.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 max-w-[200px] truncate">
                        {coupon.description || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-800 text-gray-300">
                          {typeLabel(coupon.type)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium">
                        {formatValue(coupon)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {coupon.usedCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            coupon.isActive
                              ? "bg-green-900/50 text-green-400"
                              : "bg-red-900/50 text-red-400"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>
                            {coupon.startDate
                              ? new Date(coupon.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                              : "—"}
                            {" → "}
                            {coupon.endDate
                              ? new Date(coupon.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                              : "No end"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(coupon)}
                            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(coupon.id)}
                            className="text-gray-400 hover:text-red-400 p-1.5 rounded hover:bg-gray-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && coupons.length === 0 && (
          <div className="py-16 text-center">
            <Tag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No coupons yet</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-serif font-bold text-white">
                {editingId ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 font-mono tracking-wide"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
              </div>

              {/* Type + Value row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as CouponForm["type"] })
                    }
                    className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Value{" "}
                    {form.type === "PERCENTAGE" ? (
                      <span className="text-gray-500">(0–100%)</span>
                    ) : form.type === "FIXED" ? (
                      <span className="text-gray-500">(₹)</span>
                    ) : null}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={form.type === "PERCENTAGE" ? 100 : undefined}
                      step={form.type === "PERCENTAGE" ? 1 : 0.01}
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                      disabled={form.type === "FREE_SHIPPING"}
                      className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:opacity-40"
                    />
                    {form.type === "PERCENTAGE" && (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Min order & Max discount row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="Optional"
                    className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Max Discount Amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    placeholder="Optional"
                    disabled={form.type !== "PERCENTAGE"}
                    className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Usage limit & Per user limit row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: Number(e.target.value) })}
                    className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-sm text-gray-300">Active</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.isActive ? "bg-brand-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      form.isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={handleSave}>
                {editingId ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-white mb-2">Delete Coupon</h3>
              <p className="text-sm text-gray-400">
                If this coupon has been used, it will be deactivated instead of deleted.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(null)}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
