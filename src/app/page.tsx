import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { DropCard } from "@/components/drop-card";
import { ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/config/site";
import { CATEGORIES, getCategoryLabel } from "@/data/taxonomy";
import {
  getBrand,
  getBrands,
  getCatalog,
  getItemsByBrand,
  getItemsByDrop,
  getRenderTime,
  getUpcomingDrops,
} from "@/lib/catalog";
import { sortItems } from "@/lib/filters";
import { getStatus, isNew } from "@/lib/status";

export default function HomePage() {
  const now = getRenderTime();
  const catalog = getCatalog();
  const brands = getBrands();
  const upcomingDrops = getUpcomingDrops(now);

  const available = catalog.filter((item) => getStatus(item, now) === "available");
  const newItems = sortItems(available.filter((item) => isNew(item, now)), "newest", now);
  // Te weinig nieuwe items? Vul aan met de meest recente beschikbare items.
  const latest = (newItems.length >= 4 ? newItems : sortItems(available, "newest", now)).slice(0, 8);
  const featured = sortItems(
    catalog.filter(
      (item) =>
        item.featured && getStatus(item, now) !== "sold-out" && !latest.some((l) => l.id === item.id),
    ),
    "newest",
    now,
  ).slice(0, 4);
  const heroItem = latest.find((item) => item.images?.length) ?? latest[0];
  const heroDetail = heroItem?.images?.[1];
  const heroBrand = heroItem && getBrand(heroItem.brand);
  const categories = CATEGORIES.map((c) => ({
    ...c,
    count: catalog.filter((item) => item.category === c.id).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="grid gap-8 border-b border-line py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
        <div className="rise">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {brands.length} {brands.length === 1 ? "label" : "labels"} · {catalog.length} {catalog.length === 1 ? "piece" : "pieces"}
            {upcomingDrops.length > 0 && ` · ${upcomingDrops.length} upcoming ${upcomingDrops.length === 1 ? "drop" : "drops"}`}
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.045em] text-balance sm:text-7xl">
            Small labels, given the spotlight.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            We follow independent studios and bring their releases together in one place. Every
            piece links straight to the label’s own store, so you buy directly from the people who
            made it.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/shop"
              className="rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-85"
            >
              Shop all
            </Link>
            <Link
              href="/brands"
              className="rounded-full border border-line px-6 py-3 text-sm font-medium transition-colors hover:border-fg"
            >
              Meet the labels
            </Link>
          </div>
        </div>

        {heroItem && (
          <Link href={`/product/${heroItem.id}`} className="rise group relative block [animation-delay:120ms]">
            {/* Redactionele opzet: grote foto plus een tweede beeld van hetzelfde stuk, iets lager. */}
            <div className={heroDetail ? "grid grid-cols-[1.6fr_1fr] items-end gap-3 sm:gap-4" : undefined}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tile">
                <ProductImage
                  src={heroItem.images?.[0]}
                  alt={`${heroItem.brandName} ${heroItem.name}`}
                  label={getCategoryLabel(heroItem.category)}
                  sizes="(min-width: 1024px) 30vw, 60vw"
                  preload
                  className="transition duration-700 ease-out group-hover:scale-[1.02]"
                />
              </div>
              {heroDetail && (
                <div className="mb-10 sm:mb-16">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-tile">
                    <ProductImage
                      src={heroDetail}
                      alt=""
                      label=""
                      sizes="(min-width: 1024px) 18vw, 40vw"
                      className="transition duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-2 hidden truncate font-mono text-[11px] uppercase tracking-wider text-muted sm:block">
                    {heroBrand?.country ? `${heroItem.brandName}, ${heroBrand.country}` : heroItem.brandName}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="text-muted">{heroItem.brandName}</span> · {heroItem.name}
              </span>
              <span className="shrink-0 font-medium">
                View
                <ArrowRight
                  aria-hidden
                  className="ml-1 inline size-[1.1em] align-[-0.2em] transition-transform duration-300 group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </span>
            </div>
          </Link>
        )}
      </section>

      {upcomingDrops.length > 0 && (
        <section className="pt-14">
          <SectionHeading eyebrow="Set an alarm" title="Upcoming drops" href="/drops" />
          <div className="grid gap-3 md:grid-cols-2">
            {upcomingDrops.slice(0, 4).map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                brand={getBrand(drop.brand)}
                items={getItemsByDrop(drop.id)}
                upcoming
              />
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="pt-14">
          <SectionHeading
            eyebrow={newItems.length >= 4 ? `Last ${siteConfig.newItemDays} days` : "Recently added"}
            title="New in"
            href={newItems.length >= 4 ? "/shop?new=1" : "/shop"}
          />
          <ProductGrid items={latest} now={now} />
        </section>
      )}

      {featured.length > 0 && (
        <section className="pt-14">
          <SectionHeading eyebrow="Picks" title="Featured" />
          <ProductGrid items={featured} now={now} />
        </section>
      )}

      {categories.length > 0 && (
        <section className="pt-14">
          <SectionHeading title="Shop by type" href="/shop" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.id}`}
                className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-fg hover:bg-fg hover:text-bg"
              >
                {category.label}
                <span className="ml-2 font-mono text-[11px] opacity-60">{category.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section className="pt-14">
          <SectionHeading eyebrow="The labels" title="Brands" href="/brands" />
          <ul className="-mt-6">
            {brands.map((brand) => {
              const items = sortItems(getItemsByBrand(brand.id), "newest", now);
              const cover = items.find((item) => item.images?.length);
              return (
                <li key={brand.id} className="reveal border-b border-line">
                  <Link
                    href={`/brands/${brand.id}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:gap-8 sm:py-6"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-3xl font-semibold tracking-[-0.04em] text-muted transition-colors duration-300 group-hover:text-fg sm:text-5xl">
                        {brand.name}
                      </span>
                      <span className="mt-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                        {[brand.country, brand.instagram && `@${brand.instagram}`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {cover && (
                      <span className="relative hidden aspect-[4/5] w-16 overflow-hidden rounded-md bg-tile opacity-0 transition duration-500 ease-out group-hover:opacity-100 sm:block">
                        <ProductImage src={cover.images?.[0]} alt="" label="" sizes="64px" />
                      </span>
                    )}
                    <span className="flex items-center gap-3 text-sm text-muted transition-colors group-hover:text-fg">
                      <span className="tabular-nums">
                        {items.length} {items.length === 1 ? "piece" : "pieces"}
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={1.75}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
