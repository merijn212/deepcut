import Link from "next/link";

import type { CatalogItem } from "@/data/types";
import { getCategoryLabel } from "@/data/taxonomy";
import { formatDateTime } from "@/lib/format";
import { getStatus, isNew, isOnSale } from "@/lib/status";
import { cn } from "@/lib/cn";
import { ItemBadges } from "./badge";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({ item, now }: { item: CatalogItem; now: number }) {
  const status = getStatus(item, now);
  const [first, second] = item.images ?? [];

  return (
    <Link href={`/product/${item.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-tile">
        <ProductImage
          src={first}
          alt={`${item.brandName} ${item.name}`}
          label={getCategoryLabel(item.category)}
          className={cn(
            "transition duration-500",
            status === "sold-out" && "opacity-60",
            second && "group-hover:opacity-0",
          )}
        />
        {second && (
          <ProductImage
            src={second}
            alt=""
            label=""
            className="opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <ItemBadges status={status} isNew={isNew(item, now)} onSale={isOnSale(item)} />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] uppercase tracking-wider text-muted">
            {item.brandName}
          </p>
          <p className="truncate text-sm font-medium underline-offset-4 group-hover:underline">
            {item.name}
          </p>
          {status === "upcoming" && item.releaseAt && (
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-accent">
              Drop {formatDateTime(item.releaseAt)}
            </p>
          )}
        </div>
        <Price price={item.price} compareAtPrice={item.compareAtPrice} className="text-sm" />
      </div>
    </Link>
  );
}

export function ProductGrid({ items, now }: { items: CatalogItem[]; now: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} now={now} />
      ))}
    </div>
  );
}
