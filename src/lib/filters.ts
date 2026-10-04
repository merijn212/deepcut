import { getCategoryLabel, type CategoryId } from "@/data/taxonomy";
import { getNewSince, getStatus, isNew, isOnSale, type ItemStatus } from "./status";

// Filterlogica voor de shop. Alle filters staan in de URL, zodat je een gefilterde
// shop kunt delen of linken (bijv. /shop?category=hoodies&size=M).

export interface FilterableItem {
  id: string;
  name: string;
  brand: string;
  brandName: string;
  category: CategoryId;
  price: number;
  compareAtPrice?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  description?: string;
  addedAt: string;
  releaseAt?: string;
  soldOut?: boolean;
}

export const PARAMS = {
  q: "q",
  category: "category",
  brand: "brand",
  size: "size",
  color: "color",
  status: "status",
  onlyNew: "new",
  onlySale: "sale",
  min: "min",
  max: "max",
  sort: "sort",
} as const;

export type SortKey = "newest" | "upcoming" | "price-asc" | "price-desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "upcoming", label: "Dropping soon" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export const STATUS_OPTIONS: { value: ItemStatus; param: string; label: string }[] = [
  { value: "available", param: "available", label: "Available" },
  { value: "upcoming", param: "upcoming", label: "Dropping soon" },
  { value: "sold-out", param: "sold-out", label: "Sold out" },
];

export interface Filters {
  q: string;
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  statuses: ItemStatus[];
  onlyNew: boolean;
  onlySale: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort: SortKey;
}

type Facet = "categories" | "brands" | "sizes" | "colors" | "statuses";

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseFilters(params: URLSearchParams): Filters {
  const sort = params.get(PARAMS.sort);
  return {
    q: params.get(PARAMS.q) ?? "",
    categories: params.getAll(PARAMS.category),
    brands: params.getAll(PARAMS.brand),
    sizes: params.getAll(PARAMS.size),
    colors: params.getAll(PARAMS.color),
    statuses: params
      .getAll(PARAMS.status)
      .map((p) => STATUS_OPTIONS.find((o) => o.param === p)?.value)
      .filter((s): s is ItemStatus => s !== undefined),
    onlyNew: params.get(PARAMS.onlyNew) === "1",
    onlySale: params.get(PARAMS.onlySale) === "1",
    minPrice: parseNumber(params.get(PARAMS.min)),
    maxPrice: parseNumber(params.get(PARAMS.max)),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : "newest",
  };
}

export function countActiveFilters(f: Filters): number {
  return (
    (f.q ? 1 : 0) +
    f.categories.length +
    f.brands.length +
    f.sizes.length +
    f.colors.length +
    f.statuses.length +
    (f.onlyNew ? 1 : 0) +
    (f.onlySale ? 1 : 0) +
    (f.minPrice !== undefined ? 1 : 0) +
    (f.maxPrice !== undefined ? 1 : 0)
  );
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesQuery(item: FilterableItem, q: string): boolean {
  const haystack = normalize(
    [
      item.name,
      item.brandName,
      getCategoryLabel(item.category),
      item.description ?? "",
      ...(item.tags ?? []),
      ...(item.colors ?? []),
    ].join(" "),
  );
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

const anyOf = (selected: string[], values: string[] | undefined) =>
  selected.length === 0 || selected.some((s) => values?.includes(s));

function matches(item: FilterableItem, f: Filters, now: number, skip?: Facet): boolean {
  if (f.q && !matchesQuery(item, f.q)) return false;
  if (skip !== "categories" && !anyOf(f.categories, [item.category])) return false;
  if (skip !== "brands" && !anyOf(f.brands, [item.brand])) return false;
  if (skip !== "sizes" && !anyOf(f.sizes, item.sizes)) return false;
  if (skip !== "colors" && !anyOf(f.colors, item.colors)) return false;
  if (skip !== "statuses" && !anyOf(f.statuses, [getStatus(item, now)])) return false;
  if (f.onlyNew && !isNew(item, now)) return false;
  if (f.onlySale && !isOnSale(item)) return false;
  if (f.minPrice !== undefined && item.price < f.minPrice) return false;
  if (f.maxPrice !== undefined && item.price > f.maxPrice) return false;
  return true;
}

export function filterItems<T extends FilterableItem>(items: T[], f: Filters, now: number): T[] {
  return sortItems(
    items.filter((item) => matches(item, f, now)),
    f.sort,
    now,
  );
}

/** Aantal resultaten per optie binnen een filtergroep, rekening houdend met alle andere filters. */
export function facetCounts(
  items: FilterableItem[],
  f: Filters,
  now: number,
  facet: Facet,
): Map<string, number> {
  const counts = new Map<string, number>();
  const valuesOf = (item: FilterableItem): string[] => {
    switch (facet) {
      case "categories":
        return [item.category];
      case "brands":
        return [item.brand];
      case "sizes":
        return item.sizes ?? [];
      case "colors":
        return item.colors ?? [];
      case "statuses":
        return [getStatus(item, now)];
    }
  };
  for (const item of items) {
    if (!matches(item, f, now, facet)) continue;
    for (const value of new Set(valuesOf(item))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

export function sortItems<T extends FilterableItem>(items: T[], sort: SortKey, now: number): T[] {
  // Uitverkochte items altijd achteraan.
  const soldOutRank = (item: T) => (getStatus(item, now) === "sold-out" ? 1 : 0);
  const newest = (a: T, b: T) => getNewSince(b, now) - getNewSince(a, now);

  return [...items].sort((a, b) => {
    const rank = soldOutRank(a) - soldOutRank(b);
    if (rank !== 0) return rank;
    switch (sort) {
      case "price-asc":
        return a.price - b.price || newest(a, b);
      case "price-desc":
        return b.price - a.price || newest(a, b);
      case "upcoming": {
        const ua = getStatus(a, now) === "upcoming";
        const ub = getStatus(b, now) === "upcoming";
        if (ua && ub) return Date.parse(a.releaseAt!) - Date.parse(b.releaseAt!);
        if (ua !== ub) return ua ? -1 : 1;
        return newest(a, b);
      }
      default:
        return newest(a, b);
    }
  });
}
