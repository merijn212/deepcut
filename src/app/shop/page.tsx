import type { Metadata } from "next";
import { Suspense } from "react";

import { ShopBrowser } from "@/components/shop/shop-browser";
import { getBrands, getCatalog, getRenderTime } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Every item from niche Instagram brands, filterable by type, brand, size, colour and price.",
};

export default function ShopPage() {
  const brands = getBrands().map(({ id, name }) => ({ id, name }));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10">
      <h1 className="mb-6 font-display text-5xl leading-none tracking-tight sm:text-7xl">Shop</h1>
      <Suspense fallback={<ShopSkeleton />}>
        <ShopBrowser items={getCatalog()} brands={brands} initialNow={getRenderTime()} />
      </Suspense>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-9 w-24 bg-tile" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:ml-[260px] xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[4/5] bg-tile" />
        ))}
      </div>
    </div>
  );
}
