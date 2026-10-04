import "server-only";

import { brands } from "@/data/brands";
import { drops } from "@/data/drops";
import { products } from "@/data/products";
import { CATEGORIES, COLORS } from "@/data/taxonomy";
import type { Brand, CatalogItem, Drop } from "@/data/types";

export type { CatalogItem };

function validate(): void {
  const errors: string[] = [];
  const isValidDate = (value: string) => !Number.isNaN(Date.parse(value));
  const isValidUrl = (value: string) => /^https?:\/\//.test(value) || value.startsWith("/");

  const checkUnique = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${kind}: id "${id}" komt dubbel voor`);
      seen.add(id);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
        errors.push(`${kind} "${id}": gebruik alleen kleine letters, cijfers en streepjes`);
      }
    }
  };
  checkUnique("Merk", brands.map((b) => b.id));
  checkUnique("Drop", drops.map((d) => d.id));
  checkUnique("Product", products.map((p) => p.id));

  const brandIds = new Set(brands.map((b) => b.id));
  const dropById = new Map(drops.map((d) => [d.id, d]));
  const categoryIds = new Set<string>(CATEGORIES.map((c) => c.id));

  for (const drop of drops) {
    if (!brandIds.has(drop.brand)) errors.push(`Drop "${drop.id}": onbekend merk "${drop.brand}"`);
    if (!isValidDate(drop.date)) errors.push(`Drop "${drop.id}": ongeldige datum "${drop.date}"`);
  }

  for (const p of products) {
    const where = `Product "${p.id}"`;
    if (!brandIds.has(p.brand)) errors.push(`${where}: onbekend merk "${p.brand}"`);
    if (!categoryIds.has(p.category)) errors.push(`${where}: onbekende categorie "${p.category}"`);
    if (!(p.price >= 0)) errors.push(`${where}: ongeldige prijs`);
    if (!isValidDate(p.addedAt)) errors.push(`${where}: ongeldige addedAt "${p.addedAt}"`);
    if (p.releaseAt && !isValidDate(p.releaseAt)) errors.push(`${where}: ongeldige releaseAt "${p.releaseAt}"`);
    if (p.url && !isValidUrl(p.url)) errors.push(`${where}: url moet met http(s):// beginnen`);
    for (const color of p.colors ?? []) {
      if (!(color in COLORS)) errors.push(`${where}: onbekende kleur "${color}"`);
    }
    for (const size of p.soldOutSizes ?? []) {
      if (!p.sizes?.includes(size)) errors.push(`${where}: soldOutSizes bevat "${size}" maar die staat niet in sizes`);
    }
    if (p.drop) {
      const drop = dropById.get(p.drop);
      if (!drop) errors.push(`${where}: onbekende drop "${p.drop}"`);
      else if (drop.brand !== p.brand) errors.push(`${where}: hoort bij drop "${p.drop}" van een ander merk`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Fout in de catalogusdata (src/data):\n- ${errors.join("\n- ")}`);
  }
}

validate();

const brandById = new Map(brands.map((b) => [b.id, b]));
const dropById = new Map(drops.map((d) => [d.id, d]));

const catalog: CatalogItem[] = products.map((p) => {
  const drop = p.drop ? dropById.get(p.drop) : undefined;
  return {
    ...p,
    brandName: brandById.get(p.brand)!.name,
    releaseAt: p.releaseAt ?? drop?.date,
    dropTitle: drop?.title,
  };
});

export function getCatalog(): CatalogItem[] {
  return catalog;
}

export function getItem(id: string): CatalogItem | undefined {
  return catalog.find((item) => item.id === id);
}

export function getBrands(): Brand[] {
  return [...brands].sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function getBrand(id: string): Brand | undefined {
  return brandById.get(id);
}

export function getItemsByBrand(brandId: string): CatalogItem[] {
  return catalog.filter((item) => item.brand === brandId);
}

export function getDrops(): Drop[] {
  return [...drops].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export function getDrop(id: string): Drop | undefined {
  return dropById.get(id);
}

export function getItemsByDrop(dropId: string): CatalogItem[] {
  return catalog.filter((item) => item.drop === dropId);
}

export function getUpcomingDrops(now: number): Drop[] {
  return getDrops().filter((d) => Date.parse(d.date) > now);
}

export function getPastDrops(now: number): Drop[] {
  return getDrops()
    .filter((d) => Date.parse(d.date) <= now)
    .reverse();
}

/**
 * Het moment waarop de pagina op de server gerenderd wordt (bij de build en daarna
 * bij elke revalidatie, zie `revalidate` in app/layout.tsx). Bepaalt statuses als
 * "Nieuw" en "Binnenkort"; countdowns in de browser lopen daarnaast live mee.
 */
export function getRenderTime(): number {
  return Date.now();
}
