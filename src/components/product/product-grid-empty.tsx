"use client";

import Link from "next/link";
import { PickleEmptyLottie } from "./pickle-empty-lottie";

/** Client-only empty state (Lottie runs in the browser). */
export function ProductGridEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-14 md:py-20 text-center px-4">
      <PickleEmptyLottie />
      <h3 className="font-serif font-semibold text-earth-dark text-xl sm:text-2xl mb-3 mt-4 tracking-tight">
        No products found
      </h3>
      <p className="text-gray-600 text-sm sm:text-[15px] max-w-md leading-relaxed mb-6">
        Nothing in our collection matches these filters yet. Try removing a filter or shop the full range.
      </p>
      <Link
        href="/products"
        className="text-sm font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-4 decoration-brand-400/50 hover:decoration-brand-600 transition-colors"
      >
        View all products
      </Link>
    </div>
  );
}
