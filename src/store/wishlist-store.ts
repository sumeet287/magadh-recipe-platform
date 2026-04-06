"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  syncFromServer: (productIds: string[]) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      addToWishlist: (productId) => {
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds
            : [...state.productIds, productId],
        }));
      },

      removeFromWishlist: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }));
      },

      toggleWishlist: (productId) => {
        const { isInWishlist, addToWishlist, removeFromWishlist } = get();
        if (isInWishlist(productId)) {
          removeFromWishlist(productId);
        } else {
          addToWishlist(productId);
        }
      },

      isInWishlist: (productId) => {
        return get().productIds.includes(productId);
      },

      syncFromServer: (productIds) => {
        set({ productIds });
      },

      clearWishlist: () => {
        set({ productIds: [] });
      },
    }),
    {
      name: "magadh-recipe-wishlist",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
