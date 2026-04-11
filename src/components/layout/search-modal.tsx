"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Clock, Flame } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const POPULAR_SEARCHES = [
  "Mango Pickle",
  "Garlic Pickle",
  "Mixed Pickle",
  "Lemon Pickle",
  "Masala Mix",
  "Gift Hamper",
];

export function SearchModal() {
  const router = useRouter();
  const { closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [closeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      closeSearch();
    }
  };

  const handlePopularSearch = (term: string) => {
    router.push(`/search?q=${encodeURIComponent(term)}`);
    closeSearch();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSearch}
      />

      {/* Search Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <form onSubmit={handleSearch}>
          <div className="flex items-center px-5 py-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-brand-500 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for pickles, masalas, gift boxes..."
              className="flex-1 px-4 text-base text-earth-dark placeholder:text-gray-400 focus:outline-none bg-transparent"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-brand-500" />
            Popular Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handlePopularSearch(term)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-100 hover:bg-brand-50 text-earth-dark hover:text-brand-600 text-sm rounded-full border border-gray-100 hover:border-brand-200 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="px-5 pb-5 border-t border-gray-50 pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Browse Categories
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "🥒 All Pickles", href: "/products?category=pickles" },
              { label: "🌶️ Masalas", href: "/products?category=masalas-spices" },
              { label: "🎁 Gift Boxes", href: "/products?category=gift-boxes" },
              { label: "⭐ Bestsellers", href: "/products?isBestseller=true" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={closeSearch}
                className="flex items-center justify-between px-3 py-2.5 bg-cream-100 hover:bg-brand-50 rounded-xl text-sm text-earth-dark hover:text-brand-600 transition-all group"
              >
                <span>{label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
