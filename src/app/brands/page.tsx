import type { Metadata } from "next";
import Link from "next/link";

import { getBrands, getItemsByBrand, getRenderTime, getUpcomingDrops } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { getStatus } from "@/lib/status";

export const metadata: Metadata = {
  title: "Brands",
  description: "Every niche Instagram brand in the shop.",
};

export default function BrandsPage() {
  const now = getRenderTime();
  const brands = getBrands();
  const upcomingDrops = getUpcomingDrops(now);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10">
      <h1 className="font-display text-5xl leading-none tracking-tight sm:text-7xl">Brands</h1>
      <p className="mt-2 text-muted">{brands.length} {brands.length === 1 ? "label" : "labels"}, handpicked.</p>

      <ul className="mt-10 grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => {
          const items = getItemsByBrand(brand.id);
          const available = items.filter((i) => getStatus(i, now) === "available").length;
          const nextDrop = upcomingDrops.find((d) => d.brand === brand.id);
          return (
            <li key={brand.id} className="border-b border-r border-line">
              <Link href={`/brands/${brand.id}`} className="group flex h-full flex-col p-5 hover:bg-tile">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-3xl tracking-tight underline-offset-4 group-hover:underline">
                    {brand.name}
                  </h2>
                  {brand.country && (
                    <span className="font-mono text-[11px] uppercase text-muted">{brand.country}</span>
                  )}
                </div>
                {brand.instagram && (
                  <p className="font-mono text-xs text-muted">@{brand.instagram}</p>
                )}
                {brand.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{brand.description}</p>
                )}
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5 font-mono text-[11px] uppercase tracking-wider">
                  <span>{available} available</span>
                  {nextDrop && <span className="text-accent">Drops {formatDate(nextDrop.date)}</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
