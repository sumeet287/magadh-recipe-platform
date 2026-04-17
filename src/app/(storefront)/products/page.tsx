"use client";

import { useState, useCallback, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, buildQueryString } from "@/lib/utils";
import { SORT_OPTIONS } from "@/lib/constants";
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import type { ProductCardData, PaginationMeta } from "@/types";

type CategoryFilterItem = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count: { products: number };
};

/**
 * “Shop categories” on /products — only these two parent collections (not masala / combo / gift).
 * Names still come from the database; slugs must match `categories` table.
 */
const PRODUCTS_SHOP_CATEGORY_SLUGS = ["pickles", "regional-specials"] as const;

/** Quick filters by product `tags` (same as header / search links). */
const TAG_FILTERS: { label: string; value: string; icon: string }[] = [
  { label: "Amla Pickle", value: "amla", icon: "🫒" },
  { label: "Amra Pickle", value: "amra", icon: "🍑" },
  { label: "Badhal Pickle", value: "badhal", icon: "🌿" },
  { label: "Garlic", value: "garlic", icon: "🧄" },
  { label: "Green Chilli", value: "green-chilli", icon: "🌶️" },
  { label: "Karonda", value: "karonda", icon: "🫒" },
  { label: "Kathal Pickle", value: "kathal", icon: "🍈" },
  { label: "Lemon", value: "lemon", icon: "🍋" },
  { label: "Mango", value: "mango", icon: "🥭" },
  { label: "Mixed Pickle", value: "mixed", icon: "🥗" },
  { label: "Oal Pickle", value: "oal", icon: "🫚" },
  { label: "Red Chilli", value: "chilli", icon: "🌶️" },
];

const SPICE_LEVELS = [
  { label: "Mild", value: "MILD" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hot", value: "HOT" },
  { label: "Extra Hot", value: "EXTRA_HOT" },
];

const PRICE_RANGES = [
  { label: "Under ₹200", min: 0, max: 200 },
  { label: "₹200 – ₹400", min: 200, max: 400 },
  { label: "₹400 – ₹700", min: 400, max: 700 },
  { label: "Above ₹700", min: 700, max: 99999 },
];

// Sidebar filter — categories from DB (new admin categories appear automatically)
function FilterSidebar({
  params,
  onUpdate,
  onClose,
  categories,
}: {
  params: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  onClose?: () => void;
  categories: CategoryFilterItem[];
}) {
  const [openSections, setOpenSections] = useState<string[]>(["category", "price", "spice"]);

  const toggle = (key: string) =>
    setOpenSections((s) =>
      s.includes(key) ? s.filter((k) => k !== key) : [...s, key]
    );

  const FilterSection = ({
    title,
    id,
    children,
  }: {
    title: string;
    id: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        type="button"
        onClick={() => toggle(id)}
        className="flex items-center justify-between w-full text-sm font-semibold text-earth-dark mb-3"
      >
        {title}
        {openSections.includes(id) ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {openSections.includes(id) && children}
    </div>
  );

  return (
    <div className="bg-white p-5 rounded-2xl shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif font-semibold text-earth-dark flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-500" />
          Filters
        </h3>
        <div className="flex items-center gap-2">
          {onClose && (
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          {Object.keys(params).some((k) =>
            ["category", "tags", "spiceLevel", "minPrice", "maxPrice", "inStock", "isBestseller", "isVeg", "isNewArrival"].includes(k)
          ) && (
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  category: "",
                  tags: "",
                  spiceLevel: "",
                  minPrice: "",
                  maxPrice: "",
                  inStock: "",
                  isBestseller: "",
                  isVeg: "",
                  isNewArrival: "",
                })
              }
              className="text-xs text-spice-500 hover:text-spice-600 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Category: tag shortcuts + every active shop category from DB (no hiding empty parents) */}
      <FilterSection title="Category" id="category">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onUpdate({ category: "", tags: "", page: "1" })}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              !params.category && !params.tags
                ? "bg-brand-50 text-brand-600 font-medium"
                : "text-earth-700 hover:bg-cream-200"
            )}
          >
            All
          </button>
          {TAG_FILTERS.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => onUpdate({ tags: t.value, category: "", page: "1" })}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                params.tags === t.value && !params.category
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-earth-700 hover:bg-cream-200"
              )}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
          {categories.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-3 pb-1">
                Shop categories
              </p>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => onUpdate({ category: cat.slug, tags: "", page: "1" })}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    params.category === cat.slug
                      ? "bg-brand-50 text-brand-600 font-medium"
                      : "text-earth-700 hover:bg-cream-200"
                  )}
                >
                  {cat.name}
                  {cat._count?.products > 0 && (
                    <span className="text-gray-400 font-normal ml-1">({cat._count.products})</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" id="price">
        <div className="space-y-1.5">
          {PRICE_RANGES.map((r) => (
            <button
              type="button"
              key={r.label}
              onClick={() =>
                onUpdate({
                  minPrice: String(r.min),
                  maxPrice: String(r.max),
                  page: "1",
                })
              }
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                params.minPrice === String(r.min) && params.maxPrice === String(r.max)
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-earth-700 hover:bg-cream-200"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Spice Level */}
      <FilterSection title="Spice Level" id="spice">
        <div className="space-y-1.5">
          {SPICE_LEVELS.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() =>
                onUpdate({
                  spiceLevel: params.spiceLevel === s.value ? "" : s.value,
                  page: "1",
                })
              }
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                params.spiceLevel === s.value
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-earth-700 hover:bg-cream-200"
              )}
            >
              🌶️ {s.label}
              {params.spiceLevel === s.value && (
                <span className="ml-auto text-brand-500">✓</span>
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Other Filters */}
      <FilterSection title="More Filters" id="more">
        <div className="space-y-2">
          {[
            { label: "Vegetarian Only", key: "isVeg", value: "true" },
            { label: "Bestsellers Only", key: "isBestseller", value: "true" },
            { label: "In Stock Only", key: "inStock", value: "true" },
            { label: "New Arrivals", key: "isNewArrival", value: "true" },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={params[f.key] === f.value}
                onChange={(e) =>
                  onUpdate({
                    [f.key]: e.target.checked ? f.value : "",
                    page: "1",
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
              />
              <span className="text-sm text-earth-700 group-hover:text-brand-600 transition-colors">
                {f.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const listingQueryKey = searchParams.toString();

  const { data: categoriesRaw } = useQuery({
    queryKey: ["categories", "storefront-filters"],
    queryFn: async (): Promise<CategoryFilterItem[]> => {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return [];
      return json.data as CategoryFilterItem[];
    },
    staleTime: 300_000,
  });
  const filterCategories = useMemo(() => {
    const raw = categoriesRaw ?? [];
    const order = PRODUCTS_SHOP_CATEGORY_SLUGS;
    const allowed = new Set<string>(order);
    return raw
      .filter((c) => allowed.has(c.slug))
      .sort(
        (a, b) =>
          order.indexOf(a.slug as (typeof order)[number]) -
          order.indexOf(b.slug as (typeof order)[number])
      );
  }, [categoriesRaw]);

  const { data, isPending } = useQuery({
    queryKey: ["products", "listing", listingQueryKey],
    queryFn: async (): Promise<{
      products: ProductCardData[];
      meta: PaginationMeta | null;
    }> => {
      try {
        const qs = buildQueryString(Object.fromEntries(searchParams));
        const res = await fetch(`/api/products${qs}`);
        const json = await res.json();
        if (!json.success) {
          return { products: [], meta: null };
        }
        return { products: json.data, meta: json.meta };
      } catch {
        return { products: [], meta: null };
      }
    },
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const products = data?.products ?? [];
  const meta = data?.meta ?? null;

  const getParams = useCallback(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  const params = getParams();

  const updateParams = useCallback(
    (updates: Record<string, string>, nav?: { scroll?: boolean }) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) current.set(k, v);
        else current.delete(k);
      });
      const scroll = nav?.scroll ?? false;
      router.push(`/products?${current.toString()}`, { scroll });
    },
    [router, searchParams]
  );

  const activeFilterCount = [
    params.category,
    params.tags,
    params.spiceLevel,
    params.minPrice,
    params.inStock,
    params.isBestseller,
    params.isVeg,
    params.isNewArrival,
  ].filter(Boolean).length;

  const tagFilterLabel = params.tags
    ? TAG_FILTERS.find((t) => t.value === params.tags)?.label ?? params.tags
    : null;
  const categoryTitle = params.category
    ? filterCategories.find((c) => c.slug === params.category)?.name ?? params.category
    : tagFilterLabel;

  const currentSort = params.sort ?? "featured";
  const currentPage = Number(params.page ?? 1);

  return (
    <div>
      {/* Page Header */}
      <div className="bg-hero-gradient text-cream-100 py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-brand-400 text-sm uppercase tracking-widest mb-1">
            Browse
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            {categoryTitle ?? "All Products"}
          </h1>
          {meta && (
            <p className="text-cream-400 text-sm mt-2">
              {meta.total} products found
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Mobile filter button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Active filter tags */}
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            {params.category && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer"
                onClick={() => updateParams({ category: "" })}
              >
                {filterCategories.find((c) => c.slug === params.category)?.name ?? params.category}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {params.tags && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer"
                onClick={() => updateParams({ tags: "" })}
              >
                {tagFilterLabel}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {params.spiceLevel && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer"
                onClick={() => updateParams({ spiceLevel: "" })}
              >
                🌶️ {params.spiceLevel}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>

          {/* Sort */}
          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white text-earth-dark"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterSidebar params={params} onUpdate={updateParams} categories={filterCategories} />
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            <ProductGrid products={products} loading={isPending} />

            {meta && meta.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={meta.totalPages}
                onPageChange={(page) =>
                  updateParams({ page: String(page) }, { scroll: true })
                }
                className="mt-10"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-4 overflow-y-auto animate-slide-in-right">
            <FilterSidebar
              params={params}
              onUpdate={(u) => {
                updateParams(u);
                setShowMobileFilters(false);
              }}
              onClose={() => setShowMobileFilters(false)}
              categories={filterCategories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-7xl px-4 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-2xl aspect-square" />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
