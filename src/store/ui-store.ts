"use client";

import { create } from "zustand";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface UIStore {
  // Search
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // Mobile Menu
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Recently Viewed
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;

  // Quick View
  quickViewProductId: string | null;
  setQuickViewProduct: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),

  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, toast.duration ?? 4000);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  recentlyViewed: [],
  addRecentlyViewed: (productId) => {
    set((state) => {
      const filtered = state.recentlyViewed.filter((id) => id !== productId);
      return { recentlyViewed: [productId, ...filtered].slice(0, 10) };
    });
  },

  quickViewProductId: null,
  setQuickViewProduct: (id) => set({ quickViewProductId: id }),
}));
