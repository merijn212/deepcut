import Link from "next/link";

import type { CatalogItem } from "@/data/types";
import { COLORS, getCategoryLabel } from "@/data/taxonomy";
import { getColorways } from "@/lib/colorways";
import { formatDateTime } from "@/lib/format";
import { getStatus, isNew, isOnSale } from "@/lib/status";
import { cn } from "@/lib/cn";
import { ItemBadges } from "./badge";
import { Price } from "./price";
import { ProductImage } from "./product-image";

/** Hoeveel kleurstaaltjes een kaart toont; de rest wordt "+n". */
const MAX_SWATCHES = 5;

/** "XS (W28/L28)" wordt "XS": op de kaart is alleen de korte maat leesbaar. */
const shortSize = (size: string) => size.split(" (")[0];

export function ProductCard({ item, now }: { item: CatalogItem; now: number }) {
  const status = getStatus(item, now);
  const [first, second] = item.images ?? [];
  const colorways = getColorways(item);
  const sizes = item.sizes ?? [];

  return (
    <Link href={`/product/${item.id}`} className="reveal group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-tile">
        <ProductImage
          src={first}
          alt={`${item.brandName} ${item.name}`}
          label={getCategoryLabel(item.category)}
          className={cn(
            "transition duration-700 ease-out group-hover:scale-[1.03]",
            status === "sold-out" && "opacity-60",
            second && "group-hover:opacity-0",
          )}
        />
        {second && (
          <ProductImage
            src={second}
            alt=""
            label=""
            className="opacity-0 transition duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          <ItemBadges status={status} isNew={isNew(item, now)} onSale={isOnSale(item)} />
        </div>
        {/* Maten schuiven bij hover onder in de foto in beeld (alleen met muis). */}
        {status === "available" && sizes.length > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 bottom-2 hidden translate-y-2 items-center gap-x-2.5 gap-y-1 rounded-lg bg-bg/90 px-3 py-2 text-[11px] font-medium opacity-0 backdrop-blur transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:flex [@media(hover:hover)]:flex-wrap"
          >
            {sizes.length <= 6 ? (
              sizes.map((size) => (
                <span
                  key={size}
                  className={cn((item.soldOutSizes ?? []).includes(size) && "text-muted line-through")}
                >
                  {shortSize(size)}
                </span>
              ))
            ) : (
              <span>
                {shortSize(sizes[0])} to {shortSize(sizes[sizes.length - 1])}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] uppercase tracking-wider text-muted">
            {item.brandName}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-px transition-[background-size] duration-300 ease-out group-hover:bg-[length:100%_1px]">
              {item.name}
            </span>
          </p>
          {colorways.length > 1 && (
            <p className="mt-1.5 flex items-center gap-1" aria-label={`${colorways.length} colours`}>
              {colorways.slice(0, MAX_SWATCHES).map((colorway) => (
                <span
                  key={colorway.name}
                  title={colorway.name}
                  className="size-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: colorway.color ? COLORS[colorway.color].swatch : "var(--tile)" }}
                />
              ))}
              {colorways.length > MAX_SWATCHES && (
                <span className="ml-0.5 text-[11px] text-muted">+{colorways.length - MAX_SWATCHES}</span>
              )}
            </p>
          )}
          {status === "upcoming" && item.releaseAt && (
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-accent">
              Drops {formatDateTime(item.releaseAt)}
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
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} now={now} />
      ))}
    </div>
  );
}
