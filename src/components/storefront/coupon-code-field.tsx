"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import type { CouponData } from "@/types";

type ApiErr = { success?: false; error?: string; message?: string };

function parseCouponPayload(raw: unknown): CouponData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const code = typeof o.code === "string" ? o.code : null;
  const type = typeof o.type === "string" ? o.type : null;
  const value =
    typeof o.value === "number"
      ? o.value
      : typeof o.discountValue === "number"
        ? o.discountValue
        : null;
  const discountAmount = typeof o.discountAmount === "number" ? o.discountAmount : null;
  const id = typeof o.id === "string" ? o.id : `temp-${code ?? "coupon"}`;
  if (!code || !type || value === null || discountAmount === null) return null;
  let maxDiscountAmount: number | null | undefined;
  if (o.maxDiscountAmount === null) maxDiscountAmount = null;
  else if (typeof o.maxDiscountAmount === "number") maxDiscountAmount = o.maxDiscountAmount;

  const description =
    typeof o.description === "string"
      ? o.description
      : o.description === null
        ? null
        : undefined;

  return {
    id,
    code,
    type,
    value,
    maxDiscountAmount,
    discountAmount,
    description,
  };
}

type Layout = "card" | "drawer" | "embedded";

export function CouponCodeField({ layout = "card" }: { layout?: Layout }) {
  const { subtotal, coupon, couponDiscount, applyCoupon, removeCoupon } = useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleCouponApply = async () => {
    if (!couponInput.trim()) return;
    setCouponError(null);
    setCouponLoading(true);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput.trim().toUpperCase(), subtotal }),
    });
    const data = (await res.json()) as ApiErr & { success?: boolean; data?: unknown };
    setCouponLoading(false);

    if (!res.ok || !data.success) {
      setCouponError(data.error ?? data.message ?? "Invalid coupon");
      return;
    }

    const parsed = parseCouponPayload(data.data);
    if (!parsed) {
      setCouponError("Could not apply coupon. Please try again.");
      return;
    }

    applyCoupon(parsed);
    setCouponInput("");
  };

  const inner = (
    <>
      <p
        className={
          layout === "drawer"
            ? "font-semibold text-xs text-earth-dark mb-2 flex items-center gap-2"
            : "font-semibold text-sm text-earth-dark mb-3 flex items-center gap-2"
        }
      >
        <Tag className={`text-brand-500 ${layout === "drawer" ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
        Coupon code
      </p>
      {coupon ? (
        <div className="flex items-center justify-between bg-brand-50 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-brand-700">{coupon.code}</p>
            <p className="text-xs text-brand-600">− {formatCurrency(couponDiscount)} saved</p>
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            className="text-gray-400 hover:text-spice-600"
            aria-label="Remove coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value.toUpperCase());
              setCouponError(null);
            }}
            placeholder="Enter code"
            className={`flex-1 text-sm ${layout === "drawer" ? "h-8" : "h-9"}`}
            error={couponError ?? undefined}
            onKeyDown={(e) => e.key === "Enter" && handleCouponApply()}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCouponApply}
            loading={couponLoading}
            className={layout === "drawer" ? "h-8 shrink-0" : "shrink-0"}
          >
            Apply
          </Button>
        </div>
      )}
    </>
  );

  if (layout === "card") {
    return <div className="bg-white rounded-2xl shadow-card p-5">{inner}</div>;
  }

  if (layout === "embedded") {
    return <div className="border-b border-gray-100 pb-4 mb-4">{inner}</div>;
  }

  return <div>{inner}</div>;
}
