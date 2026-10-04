import { COLORS, type ColorId } from "@/data/taxonomy";
import type { Product } from "@/data/types";

// Pure helpers voor de kleuren van een item, zodat ze ook in client components werken.

/** Eén kleur van een item, met alles wat de productpagina nodig heeft om te wisselen. */
export interface ResolvedColorway {
  name: string;
  color?: ColorId;
  url?: string;
  images: string[];
  soldOutSizes: string[];
  soldOut: boolean;
}

/**
 * De kleur van het item zelf, gevolgd door de andere kleuren uit `colorways`. Een kleur waarvan
 * alle maten op zijn, telt als uitverkocht.
 */
export function getColorways(item: Product): ResolvedColorway[] {
  const sizes = item.sizes ?? [];
  const allSizesOut = (soldOut: string[]) => sizes.length > 0 && sizes.every((s) => soldOut.includes(s));
  const primaryColor = item.colors?.[0];
  const primarySoldOut = item.soldOutSizes ?? [];

  return [
    {
      name: item.colorName ?? (primaryColor ? COLORS[primaryColor].label : "Default"),
      color: primaryColor,
      url: item.url,
      images: item.images ?? [],
      soldOutSizes: primarySoldOut,
      soldOut: Boolean(item.soldOut) || allSizesOut(primarySoldOut),
    },
    ...(item.colorways ?? []).map((c) => ({
      name: c.name,
      color: c.color,
      url: c.url,
      images: c.images,
      soldOutSizes: c.soldOutSizes ?? [],
      soldOut: Boolean(c.soldOut) || allSizesOut(c.soldOutSizes ?? []),
    })),
  ];
}

/** "3 colours", of undefined als het item maar één kleur heeft. */
export function colorCountLabel(item: Product): string | undefined {
  const count = 1 + (item.colorways?.length ?? 0);
  return count > 1 ? `${count} colours` : undefined;
}
