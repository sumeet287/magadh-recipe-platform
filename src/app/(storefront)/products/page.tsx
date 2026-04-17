"use client";

import {
  useState,
  useCallback,
  Suspense,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, buildQueryString } from "@/lib/utils";
import { SORT_OPTIONS } from "@/lib/constants";
import {
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
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

type FilterMenuKey = "shop" | "type" | "spice" | "price" | "more" | "sort" | null;

const dropdownPanelClass =
  "rounded-2xl border border-earth-200/50 bg-white/[0.97] backdrop-blur-2xl py-2 shadow-[0_28px_70px_-18px_rgba(44,24,16,0.28)] overflow-hidden";

function DropdownOptionRow({
  active,
  onPick,
  children,
}: {
  active: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors",
        active
          ? "bg-gradient-to-r from-brand-50 to-amber-50/40 text-earth-dark font-semibold"
          : "text-earth-700 hover:bg-cream-50/90"
      )}
    >
      <span className="flex items-center gap-2.5 min-w-0">{children}</span>
      {active && <span className="text-brand-500 text-xs shrink-0">✓</span>}
    </button>
  );
}

function LuxuryFilterDropdown({
  id,
  openId,
  setOpenId,
  sectionLabel,
  summary,
  children,
  alignEnd,
  onClear,
}: {
  id: NonNullable<FilterMenuKey>;
  openId: FilterMenuKey;
  setOpenId: (k: FilterMenuKey) => void;
  sectionLabel: string;
  summary: string;
  children: (close: () => void) => React.ReactNode;
  alignEnd?: boolean;
  /** When set, shows a compact reset control on the trigger (clears only this facet). */
  onClear?: () => void;
}) {
  const open = openId === id;
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updatePortalPos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxW = 19.5 * 16;
    const panelW = Math.min(window.innerWidth - 32, maxW);
    let left = alignEnd ? r.right - panelW : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8));
    setPortalPos({ top: r.bottom + 8, left, width: panelW });
  }, [alignEnd]);

  useLayoutEffect(() => {
    if (!open) {
      setPortalPos(null);
      return;
    }
    updatePortalPos();
    window.addEventListener("scroll", updatePortalPos, true);
    window.addEventListener("resize", updatePortalPos);
    return () => {
      window.removeEventListener("scroll", updatePortalPos, true);
      window.removeEventListener("resize", updatePortalPos);
    };
  }, [open, updatePortalPos]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpenId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, setOpenId]);

  const close = () => setOpenId(null);
  const panelBody = children(close);

  const panelScrollClass =
    "max-h-[min(70vh,440px)] overflow-y-auto overscroll-contain";

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <div
        ref={triggerRef}
        className={cn(
          "flex min-w-[152px] sm:min-w-[162px] items-stretch rounded-xl border border-earth-200/65 bg-white/[0.96] shadow-sm transition-all",
          "hover:border-brand-300/45 hover:shadow-[0_6px_22px_-8px_rgba(212,132,58,0.22)]",
          open && "border-brand-400/45 ring-2 ring-brand-500/15 shadow-md"
        )}
      >
        <button
          type="button"
          onClick={() => setOpenId(open ? null : id)}
          className={cn(
            "flex flex-1 min-w-0 items-center gap-1.5 py-2 pl-3 text-left",
            onClear ? "pr-1" : "pr-2.5"
          )}
          aria-expanded={open}
        >
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-600/65 leading-tight">
              {sectionLabel}
            </span>
            <span className="font-serif text-sm font-semibold text-earth-dark truncate leading-snug">
              {summary}
            </span>
          </div>
          <ChevronDown
            className={cn("w-4 h-4 text-earth-400 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
        {onClear && (
          <>
            <div className="w-px shrink-0 self-stretch bg-earth-200/50 my-2" aria-hidden />
            <button
              type="button"
              className={cn(
                "group/clear shrink-0 flex items-center justify-center px-2 rounded-r-[0.65rem]",
                "text-earth-400 hover:text-brand-700 hover:bg-brand-50/90 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 focus-visible:ring-inset"
              )}
              aria-label={`Clear ${sectionLabel}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
                setOpenId(null);
              }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-earth-200/70 bg-cream-50/80 shadow-sm transition-all group-hover/clear:border-brand-300/60 group-hover/clear:bg-white group-hover/clear:shadow-[0_2px_10px_rgba(212,132,58,0.15)]">
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </button>
          </>
        )}
      </div>
      {open &&
        portalPos &&
        createPortal(
          <div
            ref={panelRef}
            className={cn(dropdownPanelClass, panelScrollClass, "fixed z-[100]")}
            style={{
              top: portalPos.top,
              left: portalPos.left,
              width: portalPos.width,
            }}
          >
            {panelBody}
          </div>,
          document.body
        )}
    </div>
  );
}

function ProductsFilterRail({
  params,
  onUpdate,
  currentSort,
  onSortChange,
  onOpenMobileDrawer,
  activeFilterCount,
  tagFilterLabel,
  filterCategories,
}: {
  params: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  currentSort: string;
  onSortChange: (sort: string) => void;
  onOpenMobileDrawer: () => void;
  activeFilterCount: number;
  tagFilterLabel: string | null;
  filterCategories: CategoryFilterItem[];
}) {
  const [openMenu, setOpenMenu] = useState<FilterMenuKey>(null);

  const hasActive =
    !!params.category ||
    !!params.tags ||
    !!params.spiceLevel ||
    !!params.minPrice ||
    !!params.inStock ||
    !!params.isBestseller ||
    !!params.isVeg ||
    !!params.isNewArrival;

  const shopSummary = params.category
    ? filterCategories.find((c) => c.slug === params.category)?.name ?? params.category
    : "All collections";

  const typeSummary = params.tags ? tagFilterLabel ?? params.tags : "Any type";

  const spiceSummary =
    SPICE_LEVELS.find((s) => s.value === params.spiceLevel)?.label ?? "Any heat";

  const priceBand = PRICE_RANGES.find(
    (r) => params.minPrice === String(r.min) && params.maxPrice === String(r.max)
  );
  const priceSummary = priceBand?.label ?? "Any price";

  const moreLabels: string[] = [];
  if (params.isVeg === "true") moreLabels.push("Vegetarian");
  if (params.isBestseller === "true") moreLabels.push("Bestsellers");
  if (params.inStock === "true") moreLabels.push("In stock");
  if (params.isNewArrival === "true") moreLabels.push("New");
  const moreSummary =
    moreLabels.length === 0
      ? "Any"
      : moreLabels.length <= 2
        ? moreLabels.join(" · ")
        : `${moreLabels.length} filters`;

  const sortSummary =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Featured";

  const moreFilterRows = [
    { label: "Vegetarian", key: "isVeg" as const, value: "true" },
    { label: "Bestsellers", key: "isBestseller" as const, value: "true" },
    { label: "In stock", key: "inStock" as const, value: "true" },
    { label: "New", key: "isNewArrival" as const, value: "true" },
  ];

  return (
    <div
      className={cn(
        "sticky top-16 z-40 rounded-[1.25rem] border border-earth-200/55",
        "bg-gradient-to-br from-white/98 via-cream-50/95 to-white/98 shadow-[0_12px_48px_-16px_rgba(44,24,16,0.14)]",
        "backdrop-blur-md backdrop-saturate-150 p-4 md:p-6"
      )}
    >
      <div className="min-w-0 w-full">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-hide [overscroll-behavior-x:contain] [-webkit-overflow-scrolling:touch] lg:mx-0 lg:overflow-x-auto lg:overflow-y-visible lg:px-0 lg:pb-0">
          <div className="flex w-max max-w-none flex-nowrap items-center gap-1 sm:gap-1.5">
            <LuxuryFilterDropdown
              id="shop"
              openId={openMenu}
              setOpenId={setOpenMenu}
              sectionLabel="Shop"
              summary={shopSummary}
              onClear={
                params.category
                  ? () => onUpdate({ category: "", page: "1" })
                  : undefined
              }
            >
              {(close) => (
                <>
                  <DropdownOptionRow
                    active={!params.category && !params.tags}
                    onPick={() => {
                      onUpdate({ category: "", tags: "", page: "1" });
                      close();
                    }}
                  >
                    All
                  </DropdownOptionRow>
                  {filterCategories.map((cat) => (
                    <DropdownOptionRow
                      key={cat.id}
                      active={params.category === cat.slug}
                      onPick={() => {
                        onUpdate({ category: cat.slug, tags: "", page: "1" });
                        close();
                      }}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{cat.name}</span>
                        {cat._count?.products > 0 && (
                          <span className="text-xs font-normal text-earth-500 shrink-0 tabular-nums">
                            ({cat._count.products})
                          </span>
                        )}
                      </span>
                    </DropdownOptionRow>
                  ))}
                </>
              )}
            </LuxuryFilterDropdown>

            <LuxuryFilterDropdown
              id="type"
              openId={openMenu}
              setOpenId={setOpenMenu}
              sectionLabel="Pickle type"
              summary={typeSummary}
              onClear={params.tags ? () => onUpdate({ tags: "", page: "1" }) : undefined}
            >
              {(close) => (
                <>
                  <DropdownOptionRow
                    active={!params.tags}
                    onPick={() => {
                      onUpdate({ tags: "", page: "1" });
                      close();
                    }}
                  >
                    Any type
                  </DropdownOptionRow>
                  {TAG_FILTERS.map((t) => (
                    <DropdownOptionRow
                      key={t.value}
                      active={params.tags === t.value}
                      onPick={() => {
                        onUpdate({ tags: t.value, category: "", page: "1" });
                        close();
                      }}
                    >
                      <span className="text-base leading-none shrink-0" aria-hidden>
                        {t.icon}
                      </span>
                      <span className="truncate">{t.label}</span>
                    </DropdownOptionRow>
                  ))}
                </>
              )}
            </LuxuryFilterDropdown>

            <LuxuryFilterDropdown
              id="spice"
              openId={openMenu}
              setOpenId={setOpenMenu}
              sectionLabel="Spice"
              summary={spiceSummary}
              onClear={
                params.spiceLevel
                  ? () => onUpdate({ spiceLevel: "", page: "1" })
                  : undefined
              }
            >
              {(close) => (
                <>
                  <DropdownOptionRow
                    active={!params.spiceLevel}
                    onPick={() => {
                      onUpdate({ spiceLevel: "", page: "1" });
                      close();
                    }}
                  >
                    Any heat
                  </DropdownOptionRow>
                  {SPICE_LEVELS.map((s) => (
                    <DropdownOptionRow
                      key={s.value}
                      active={params.spiceLevel === s.value}
                      onPick={() => {
                        onUpdate({
                          spiceLevel: params.spiceLevel === s.value ? "" : s.value,
                          page: "1",
                        });
                        close();
                      }}
                    >
                      {s.label}
                    </DropdownOptionRow>
                  ))}
                </>
              )}
            </LuxuryFilterDropdown>

            <LuxuryFilterDropdown
              id="price"
              openId={openMenu}
              setOpenId={setOpenMenu}
              sectionLabel="Price"
              summary={priceSummary}
              onClear={
                params.minPrice || params.maxPrice
                  ? () => onUpdate({ minPrice: "", maxPrice: "", page: "1" })
                  : undefined
              }
            >
              {(close) => (
                <>
                  <DropdownOptionRow
                    active={!params.minPrice && !params.maxPrice}
                    onPick={() => {
                      onUpdate({ minPrice: "", maxPrice: "", page: "1" });
                      close();
                    }}
                  >
                    Any price
                  </DropdownOptionRow>
                  {PRICE_RANGES.map((r) => (
                    <DropdownOptionRow
                      key={r.label}
                      active={
                        params.minPrice === String(r.min) && params.maxPrice === String(r.max)
                      }
                      onPick={() => {
                        onUpdate({
                          minPrice: String(r.min),
                          maxPrice: String(r.max),
                          page: "1",
                        });
                        close();
                      }}
                    >
                      {r.label}
                    </DropdownOptionRow>
                  ))}
                </>
              )}
            </LuxuryFilterDropdown>

            <LuxuryFilterDropdown
              id="more"
              openId={openMenu}
              setOpenId={setOpenMenu}
              sectionLabel="More"
              summary={moreSummary}
              onClear={
                moreLabels.length > 0
                  ? () =>
                      onUpdate({
                        inStock: "",
                        isBestseller: "",
                        isVeg: "",
                        isNewArrival: "",
                        page: "1",
                      })
                  : undefined
              }
            >
              {(close) => (
                <>
                  {moreFilterRows.map((f) => (
                    <DropdownOptionRow
                      key={f.key}
                      active={params[f.key] === f.value}
                      onPick={() => {
                        onUpdate({
                          [f.key]: params[f.key] === f.value ? "" : f.value,
                          page: "1",
                        });
                        close();
                      }}
                    >
                      {f.label}
                    </DropdownOptionRow>
                  ))}
                </>
              )}
            </LuxuryFilterDropdown>

            <LuxuryFilterDropdown
              id="sort"
              openId={openMenu}
              setOpenId={setOpenMenu}
              sectionLabel="Sort by"
              summary={sortSummary}
              alignEnd
              onClear={
                params.sort ? () => onUpdate({ sort: "", page: "1" }) : undefined
              }
            >
              {(close) => (
                <>
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownOptionRow
                      key={opt.value}
                      active={opt.value === currentSort}
                      onPick={() => {
                        onSortChange(opt.value);
                        close();
                      }}
                    >
                      {opt.label}
                    </DropdownOptionRow>
                  ))}
                </>
              )}
            </LuxuryFilterDropdown>

            {hasActive && (
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
                    page: "1",
                  })
                }
                className="self-center text-xs font-semibold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline whitespace-nowrap pl-1 pr-0.5 py-2 shrink-0"
              >
                Clear all
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenMobileDrawer}
              className="lg:hidden shrink-0 self-center border-earth-200 text-earth-700 rounded-xl whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4" />
              All filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar filter — mobile drawer only (full accordion)
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
          {isPending ? (
            <div className="mt-3 h-4 w-36 rounded bg-cream-200/20 animate-pulse" aria-hidden />
          ) : (
            meta && (
              <p className="text-cream-400 text-sm mt-2">{meta.total} products found</p>
            )
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <ProductsFilterRail
          params={params}
          onUpdate={updateParams}
          filterCategories={filterCategories}
          currentSort={currentSort}
          onSortChange={(sort) => updateParams({ sort, page: "1" })}
          onOpenMobileDrawer={() => setShowMobileFilters(true)}
          activeFilterCount={activeFilterCount}
          tagFilterLabel={tagFilterLabel}
        />

        <div
          className={cn(
            "relative z-0 mt-8 transition-opacity duration-300 ease-out",
            isPending ? "opacity-70 pointer-events-none" : "opacity-100"
          )}
        >
          <ProductGrid
            products={products}
            loading={isPending}
            skeletonCount={12}
            className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"
          />
        </div>

        {!isPending && meta && meta.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={meta.totalPages}
            onPageChange={(page) => updateParams({ page: String(page) }, { scroll: true })}
            className="mt-10"
          />
        )}
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
