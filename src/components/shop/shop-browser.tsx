"use client";

import { X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProductGrid } from "@/components/product-card";
import { CATEGORIES, COLORS, compareSizes, type ColorId } from "@/data/taxonomy";
import type { CatalogItem } from "@/data/types";
import { cn } from "@/lib/cn";
import {
  countActiveFilters,
  facetCounts,
  filterItems,
  parseFilters,
  PARAMS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "@/lib/filters";
import { formatPrice } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { FilterPanel, type FacetOptions } from "./filter-panel";

export function ShopBrowser({
  items,
  brands,
  initialNow,
}: {
  items: CatalogItem[];
  brands: { id: string; name: string }[];
  initialNow: number;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const now = useNow(60_000) ?? initialNow;
  const [panelOpen, setPanelOpen] = useState(false);

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const results = useMemo(() => filterItems(items, filters, now), [items, filters, now]);

  const options = useMemo<FacetOptions>(() => {
    const sizes = new Set<string>();
    const colors = new Set<ColorId>();
    for (const item of items) {
      item.sizes?.forEach((s) => sizes.add(s));
      item.colors?.forEach((c) => colors.add(c));
    }
    const colorOrder = Object.keys(COLORS);
    return {
      brands: brands.filter((b) => items.some((i) => i.brand === b.id)),
      sizes: [...sizes].sort(compareSizes),
      colors: [...colors].sort((a, b) => colorOrder.indexOf(a) - colorOrder.indexOf(b)),
    };
  }, [items, brands]);

  const counts = useMemo(
    () => ({
      categories: facetCounts(items, filters, now, "categories"),
      brands: facetCounts(items, filters, now, "brands"),
      sizes: facetCounts(items, filters, now, "sizes"),
      colors: facetCounts(items, filters, now, "colors"),
      statuses: facetCounts(items, filters, now, "statuses"),
    }),
    [items, filters, now],
  );

  // Native replaceState: Next.js synchroniseert useSearchParams hiermee, zonder
  // server-roundtrip, dus filteren voelt direct.
  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, pathname],
  );

  const toggle = useCallback(
    (key: string, value: string) =>
      updateParams((params) => {
        const values = params.getAll(key);
        params.delete(key);
        const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
        next.forEach((v) => params.append(key, v));
      }),
    [updateParams],
  );

  const set = useCallback(
    (key: string, value: string | undefined) =>
      updateParams((params) => (value ? params.set(key, value) : params.delete(key))),
    [updateParams],
  );

  const clearAll = () =>
    updateParams((params) => {
      for (const key of Object.values(PARAMS)) {
        if (key !== PARAMS.sort) params.delete(key);
      }
    });

  // Zoekveld: debounced naar de URL, en terug-synchroniseren als de zoekterm
  // van buitenaf verandert (chip weggeklikt, "Clear all", navigatie).
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const input = searchRef.current;
    if (input && document.activeElement !== input) input.value = filters.q;
  }, [filters.q]);
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const onSearch = (value: string) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => set(PARAMS.q, value.trim() || undefined), 250);
  };

  const activeCount = countActiveFilters(filters);
  const chips = buildChips(filters, brands);
  const categoriesWithItems = CATEGORIES.filter((c) => items.some((i) => i.category === c.id));

  return (
    <div>
      {/* Categorieën */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        <CategoryPill
          active={filters.categories.length === 0}
          onClick={() => updateParams((p) => p.delete(PARAMS.category))}
        >
          All
        </CategoryPill>
        {categoriesWithItems.map((category) => (
          <CategoryPill
            key={category.id}
            active={filters.categories.includes(category.id)}
            count={counts.categories.get(category.id) ?? 0}
            onClick={() => toggle(PARAMS.category, category.id)}
          >
            {category.label}
          </CategoryPill>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <FilterPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          filters={filters}
          options={options}
          counts={counts}
          resultCount={results.length}
          onToggle={toggle}
          onSet={set}
        />

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              ref={searchRef}
              type="search"
              placeholder="Search items, brands or types…"
              defaultValue={filters.q}
              onChange={(e) => onSearch(e.currentTarget.value)}
              className="min-w-0 flex-1 basis-full border border-line bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-fg sm:basis-auto"
            />
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="border border-line px-3 py-2 font-mono text-xs uppercase tracking-wider hover:border-fg lg:hidden"
            >
              Filters{activeCount > 0 && ` (${activeCount})`}
            </button>
            <label className="flex items-center gap-2 border border-line px-3 py-2 focus-within:border-fg">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Sort</span>
              <select
                value={filters.sort}
                onChange={(e) =>
                  set(PARAMS.sort, e.currentTarget.value === "newest" ? undefined : e.currentTarget.value)
                }
                className="bg-transparent text-sm outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-1.5">
            <p className="mr-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              {results.length} {results.length === 1 ? "item" : "items"}
            </p>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() =>
                  updateParams((p) =>
                    chip.value === undefined ? p.delete(chip.param) : p.delete(chip.param, chip.value),
                  )
                }
                className="flex items-center gap-1 bg-tile px-2 py-1 text-xs hover:bg-line"
              >
                {chip.label} <X aria-hidden className="size-3.5" strokeWidth={1.75} />
                <span className="sr-only">remove filter</span>
              </button>
            ))}
            {chips.length > 1 && (
              <button
                type="button"
                onClick={clearAll}
                className="px-1 font-mono text-[11px] uppercase tracking-wider underline underline-offset-4"
              >
                Wis alles
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <ProductGrid items={results} now={now} />
          ) : (
            <div className="border border-dashed border-line px-6 py-16 text-center">
              <p className="font-medium">No items found</p>
              <p className="mt-1 text-sm text-muted">Try fewer filters or a different search.</p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 bg-fg px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryPill({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 border px-3 py-1.5 text-sm transition-colors",
        active ? "border-fg bg-fg text-bg" : "border-line hover:border-fg",
        !active && count === 0 && "opacity-40",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("ml-1.5 font-mono text-[11px]", active ? "text-bg/70" : "text-muted")}>
          {count}
        </span>
      )}
    </button>
  );
}

interface Chip {
  key: string;
  label: string;
  param: string;
  value?: string;
}

function buildChips(
  f: ReturnType<typeof parseFilters>,
  brands: { id: string; name: string }[],
): Chip[] {
  const chips: Chip[] = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, param: PARAMS.q });
  for (const id of f.categories) {
    const label = CATEGORIES.find((c) => c.id === id)?.label ?? id;
    chips.push({ key: `c-${id}`, label, param: PARAMS.category, value: id });
  }
  for (const id of f.brands) {
    const label = brands.find((b) => b.id === id)?.name ?? id;
    chips.push({ key: `b-${id}`, label, param: PARAMS.brand, value: id });
  }
  for (const size of f.sizes) {
    chips.push({ key: `s-${size}`, label: `Size ${size}`, param: PARAMS.size, value: size });
  }
  for (const color of f.colors) {
    const label = COLORS[color as ColorId]?.label ?? color;
    chips.push({ key: `k-${color}`, label, param: PARAMS.color, value: color });
  }
  for (const status of f.statuses) {
    const option = STATUS_OPTIONS.find((o) => o.value === status)!;
    chips.push({ key: `st-${status}`, label: option.label, param: PARAMS.status, value: option.param });
  }
  if (f.onlyNew) chips.push({ key: "new", label: "New", param: PARAMS.onlyNew });
  if (f.onlySale) chips.push({ key: "sale", label: "Sale", param: PARAMS.onlySale });
  if (f.minPrice !== undefined) {
    chips.push({ key: "min", label: `From ${formatPrice(f.minPrice)}`, param: PARAMS.min });
  }
  if (f.maxPrice !== undefined) {
    chips.push({ key: "max", label: `Up to ${formatPrice(f.maxPrice)}`, param: PARAMS.max });
  }
  return chips;
}
