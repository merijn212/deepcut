import { siteConfig } from "@/config/site";

// Pure helpers zonder data-imports, zodat ze ook in client components werken.

export type ItemStatus = "available" | "upcoming" | "sold-out";

export interface Timed {
  addedAt: string;
  releaseAt?: string;
  soldOut?: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

export function getStatus(item: Timed, now: number): ItemStatus {
  if (item.releaseAt && Date.parse(item.releaseAt) > now) return "upcoming";
  if (item.soldOut) return "sold-out";
  return "available";
}

/** Tijdstip vanaf wanneer een item als nieuw telt: de release (als die geweest is) of de toevoegdatum. */
export function getNewSince(item: Timed, now: number): number {
  const added = Date.parse(item.addedAt);
  const release = item.releaseAt ? Date.parse(item.releaseAt) : NaN;
  if (!Number.isNaN(release) && release <= now) return Math.max(added, release);
  return added;
}

export function isNew(item: Timed, now: number): boolean {
  if (getStatus(item, now) !== "available") return false;
  return now - getNewSince(item, now) < siteConfig.newItemDays * DAY;
}

export function isOnSale(item: { price: number; compareAtPrice?: number }): boolean {
  return item.compareAtPrice !== undefined && item.compareAtPrice > item.price;
}
