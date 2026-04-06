"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import type { ProductCardData } from "@/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=24`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.data?.products ?? []);
        setTotal(d.data?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [q]);

  if (!q) {
    return (
      <div className="text-center py-20">
        <Search className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Type something to search...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-xl font-bold text-earth-dark">
            Search results for &ldquo;{q}&rdquo;
          </h1>
          {!loading && (
            <p className="text-sm text-gray-400 mt-1">{total} product{total !== 1 ? "s" : ""} found</p>
          )}
        </div>
        {q && (
          <Link href="/search" className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">No products found.</p>
          <p className="text-sm text-gray-400 mt-1">Try different keywords or browse our categories.</p>
          <Link href="/products" className="mt-4 inline-block text-sm text-brand-600 font-medium">
            Browse All Products →
          </Link>
        </div>
      ) : (
        <ProductGrid products={results} />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 min-h-screen">
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
