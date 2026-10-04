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
  const categories = CATEGORIES.map((c) => ({
    ...c,
    count: catalog.filter((item) => item.category === c.id).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="grid gap-8 border-b border-line py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {brands.length} {brands.length === 1 ? "label" : "labels"} · {catalog.length} {catalog.length === 1 ? "piece" : "pieces"}
            {upcomingDrops.length > 0 && ` · ${upcomingDrops.length} upcoming ${upcomingDrops.length === 1 ? "drop" : "drops"}`}
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-7xl">
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
          <Link href={`/product/${heroItem.id}`} className="group relative block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tile lg:aspect-[5/6]">
              <ProductImage
                src={heroItem.images?.[0]}
                alt={`${heroItem.brandName} ${heroItem.name}`}
                label={getCategoryLabel(heroItem.category)}
                sizes="(min-width: 1024px) 45vw, 100vw"
                preload
                className="transition duration-700 ease-out group-hover:scale-[1.02]"
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="text-muted">{heroItem.brandName}</span> · {heroItem.name}
              </span>
              <span className="shrink-0 font-medium underline-offset-4 group-hover:underline">View<ArrowRight aria-hidden className="ml-1 inline size-[1.1em] align-[-0.2em]" strokeWidth={1.75} /></span>
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
                itemCount={getItemsByDrop(drop.id).length}
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
          <SectionHeading title="Brands" href="/brands" />
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/brands/${brand.id}`}
                  className="text-3xl font-semibold tracking-[-0.04em] text-muted transition-colors hover:text-fg sm:text-5xl"
                >
                  {brand.name}
                  <sup className="ml-1 font-mono text-[11px] font-normal tracking-normal">
                    {getItemsByBrand(brand.id).length}
                  </sup>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
