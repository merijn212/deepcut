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

const editionFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  month: "long",
  year: "numeric",
  timeZone: siteConfig.timeZone,
});

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
  // Secties krijgen een doorlopend nummer ("No. 01"); alleen zichtbare secties tellen mee.
  let sectionCount = 0;
  const nextIndex = () => ++sectionCount;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="grid gap-10 border-b border-fg py-12 sm:py-16 lg:grid-cols-[1fr_300px] lg:items-end lg:gap-16">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Edition · {editionFormatter.format(now)}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-6xl leading-[0.88] tracking-tight sm:text-8xl lg:text-[8.5rem]">
            The labels your feed <em className="text-accent">hasn’t found</em> yet.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted sm:text-lg">{siteConfig.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/shop"
              className="bg-fg px-5 py-3 font-mono text-xs uppercase tracking-wider text-bg transition-colors hover:bg-accent hover:text-accent-fg"
            >
              Shop all
            </Link>
            <Link
              href="/drops"
              className="border border-fg px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-fg hover:text-bg"
            >
              Upcoming drops
            </Link>
          </div>
        </div>

        {/* Index-kaartje met de stand van de catalogus */}
        <aside className="border border-fg bg-tile/60 p-5 font-mono text-xs uppercase tracking-wider">
          <p className="flex items-center justify-between border-b border-fg pb-2 text-[11px]">
            <span>Index</span>
            <span className="text-muted">Deepcut</span>
          </p>
          <dl className="mt-3 space-y-2.5">
            {[
              ["Brands", brands.length],
              ["Pieces", catalog.length],
              ["New in", newItems.length],
              ["Upcoming drops", upcomingDrops.length],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dt>{label}</dt>
                <span className="leader" aria-hidden />
                <dd className="tabular-nums">{String(value).padStart(2, "0")}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[10px] leading-relaxed normal-case tracking-normal text-muted">
            We don’t hold stock. Every piece links straight to the label’s own store.
          </p>
        </aside>
      </section>

      {upcomingDrops.length > 0 && (
        <section className="pt-14">
          <SectionHeading index={nextIndex()} eyebrow="Set an alarm" title="Upcoming drops" href="/drops" />
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
            index={nextIndex()}
            eyebrow={newItems.length >= 4 ? `Last ${siteConfig.newItemDays} days` : "Recently added"}
            title="New in"
            href={newItems.length >= 4 ? "/shop?new=1" : "/shop"}
          />
          <ProductGrid items={latest} now={now} />
        </section>
      )}

      {featured.length > 0 && (
        <section className="pt-14">
          <SectionHeading index={nextIndex()} eyebrow="Picks" title="Featured" />
          <ProductGrid items={featured} now={now} />
        </section>
      )}

      {categories.length > 0 && (
        <section className="pt-14">
          <SectionHeading index={nextIndex()} title="Shop by type" href="/shop" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.id}`}
                className="border border-fg px-4 py-2.5 text-sm transition-colors hover:border-accent hover:bg-accent hover:text-accent-fg"
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
          <SectionHeading index={nextIndex()} title="Brands" href="/brands" />
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/brands/${brand.id}`}
                  className="font-display text-4xl italic tracking-tight transition-colors hover:text-accent sm:text-6xl"
                >
                  {brand.name}
                  <sup className="ml-1 font-mono text-[11px] not-italic tracking-normal text-muted">
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
