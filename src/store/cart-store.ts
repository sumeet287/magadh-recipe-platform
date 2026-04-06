"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItemDisplay, CouponData } from "@/types";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  GST_RATE,
} from "@/lib/constants";

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
    if (coupon.type === "PERCENTAGE") {
      couponDiscount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscountAmount) {
        couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
      }
    } else if (coupon.type === "FIXED") {
      couponDiscount = Math.min(coupon.value, subtotal);
    }
  }

  const afterCoupon = Math.max(0, subtotal - couponDiscount);
  const shippingCharge =
    coupon?.type === "FREE_SHIPPING"
      ? 0
      : afterCoupon >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE;

  const taxableAmount = afterCoupon + shippingCharge;
  const taxAmount = Math.round((taxableAmount * GST_RATE) / 100);

  const total = afterCoupon + shippingCharge + taxAmount;
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
          return { coupon, ...calculateCartTotals(state.items, coupon) };
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
    }
  )
);
