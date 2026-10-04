import Link from "next/link";

import { DropCard } from "@/components/drop-card";
import { ProductGrid } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/config/site";
import { CATEGORIES } from "@/data/taxonomy";
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
  const categories = CATEGORIES.map((c) => ({
    ...c,
    count: catalog.filter((item) => item.category === c.id).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="border-b border-line py-14 sm:py-20">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {brands.length} {brands.length === 1 ? "brand" : "brands"} · {catalog.length} {catalog.length === 1 ? "item" : "items"} · {upcomingDrops.length} upcoming {upcomingDrops.length === 1 ? "drop" : "drops"}
        </p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-7xl lg:text-8xl">
          Niche labels.
          <br />
          One place.
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted sm:text-lg">{siteConfig.description}</p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/shop"
            className="bg-fg px-5 py-3 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-85"
          >
            Shop all
          </Link>
          <Link
            href="/drops"
            className="border border-fg px-5 py-3 font-mono text-xs uppercase tracking-wider hover:bg-fg hover:text-bg"
          >
            Upcoming drops
          </Link>
        </div>
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
                className="border border-line px-4 py-2.5 text-sm transition-colors hover:border-fg hover:bg-fg hover:text-bg"
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
                  className="text-2xl font-black uppercase tracking-tighter text-muted transition-colors hover:text-fg sm:text-4xl"
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
