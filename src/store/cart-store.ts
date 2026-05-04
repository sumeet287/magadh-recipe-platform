"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItemDisplay, CouponData } from "@/types";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  GST_RATE,
} from "@/lib/constants";

/** Legacy API / localStorage may use `discountValue` instead of `value`. */
type CouponLike = CouponData & { discountValue?: number };

function couponRuleAmount(coupon: CouponLike): number {
  const raw = coupon.value ?? coupon.discountValue;
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  const n = Number(raw);
  return Number.isNaN(n) ? NaN : n;
}

/** Ensures persisted coupons work after API shape changes. */
function normalizeStoredCoupon(coupon: CouponLike | null): CouponData | null {
  if (!coupon?.code || !coupon.type) return null;

  if (coupon.type === "FREE_SHIPPING") {
    return { ...coupon, value: 0 };
  }

  const rule = couponRuleAmount(coupon);
  if (!Number.isNaN(rule)) {
    return { ...coupon, value: rule };
  }

  const daRaw = coupon.discountAmount;
  const daNum = daRaw != null ? Number(daRaw) : NaN;
  if (!Number.isNaN(daNum)) {
    // Leave `value` unset / invalid; totals use discountAmount until next apply.
    return { ...coupon } as CouponData;
  }

  return null;
}

interface CartStore {
  items: CartItemDisplay[];
  coupon: CouponData | null;
  isOpen: boolean;

  // Computed
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  itemCount: number;

  // Actions
  addItem: (item: CartItemDisplay) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  applyCoupon: (coupon: CouponData) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  syncFromServer: (items: CartItemDisplay[]) => void;
  recalculate: () => void;
}

function calculateCartTotals(
  items: CartItemDisplay[],
  coupon: CouponData | null
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  const discount = items.reduce((sum, item) => {
    const saving = (item.variant.mrp - item.variant.price) * item.quantity;
    return sum + saving;
  }, 0);

  let couponDiscount = 0;
  if (coupon) {
    const c = coupon as CouponLike;
    if (coupon.type === "PERCENTAGE") {
      const rule = couponRuleAmount(c);
      if (!Number.isNaN(rule)) {
        couponDiscount = Math.round((subtotal * rule) / 100);
        if (coupon.maxDiscountAmount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
        }
      } else if (coupon.discountAmount != null && !Number.isNaN(Number(coupon.discountAmount))) {
        couponDiscount = Math.round(Number(coupon.discountAmount));
      }
    } else if (coupon.type === "FIXED") {
      const rule = couponRuleAmount(c);
      if (!Number.isNaN(rule)) {
        couponDiscount = Math.min(rule, subtotal);
      } else if (coupon.discountAmount != null && !Number.isNaN(Number(coupon.discountAmount))) {
        couponDiscount = Math.min(Math.round(Number(coupon.discountAmount)), subtotal);
      }
    }
  }

  const afterCoupon = Math.max(0, subtotal - couponDiscount);
  const shippingCharge =
    coupon?.type === "FREE_SHIPPING"
      ? 0
      : afterCoupon >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE;

  // Tax is inclusive (extracted from taxable amount) — matches server calculation
  const taxAmount = Math.round(((afterCoupon * GST_RATE) / (100 + GST_RATE)) * 100) / 100;

  const total = afterCoupon + shippingCharge;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    discount,
    couponDiscount,
    shippingCharge,
    taxAmount,
    total,
    itemCount,
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isOpen: false,
      subtotal: 0,
      discount: 0,
      couponDiscount: 0,
      shippingCharge: 0,
      taxAmount: 0,
      total: 0,
      itemCount: 0,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === newItem.variantId
          );
          let items: CartItemDisplay[];
          if (existing) {
            items = state.items.map((i) =>
              i.variantId === newItem.variantId
                ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, 10) }
                : i
            );
          } else {
            items = [...state.items, newItem];
          }
          return { items, ...calculateCartTotals(items, state.coupon) };
        });
      },

      removeItem: (variantId) => {
        set((state) => {
          const items = state.items.filter((i) => i.variantId !== variantId);
          return { items, ...calculateCartTotals(items, state.coupon) };
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => {
          const items = state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, 10) }
              : i
          );
          return { items, ...calculateCartTotals(items, state.coupon) };
        });
      },

      applyCoupon: (coupon) => {
        set((state) => {
          const normalized =
            normalizeStoredCoupon(coupon as CouponLike) ??
            (((coupon as CouponLike)?.code
              ? ({ ...(coupon as CouponLike) } as CouponData)
              : null));

          return {
            coupon: normalized,
            ...calculateCartTotals(state.items, normalized),
          };
        });
      },

      removeCoupon: () => {
        set((state) => {
          return { coupon: null, ...calculateCartTotals(state.items, null) };
        });
      },

      clearCart: () => {
        set({
          items: [],
          coupon: null,
          subtotal: 0,
          discount: 0,
          couponDiscount: 0,
          shippingCharge: 0,
          taxAmount: 0,
          total: 0,
          itemCount: 0,
        });
      },

      setOpen: (open) => set({ isOpen: open }),

      syncFromServer: (items) => {
        set((state) => {
          return { items, ...calculateCartTotals(items, state.coupon) };
        });
      },

      recalculate: () => {
        set((state) => ({
          ...calculateCartTotals(state.items, state.coupon),
        }));
      },
    }),
    {
      name: "magadh-recipe-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<CartStore>;
        const items = p?.items ?? [];
        const coupon = normalizeStoredCoupon((p?.coupon as CouponLike) ?? null);
        return { ...current, items, coupon, ...calculateCartTotals(items, coupon) };
      },
    }
  )
);
