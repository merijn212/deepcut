import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DropCard } from "@/components/drop-card";
import { ProductGrid } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import {
  getBrand,
  getBrands,
  getItemsByBrand,
  getItemsByDrop,
  getRenderTime,
  getUpcomingDrops,
} from "@/lib/catalog";
import { sortItems } from "@/lib/filters";
import { instagramUrl } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBrands().map((brand) => ({ id: brand.id }));
}

export async function generateMetadata({ params }: PageProps<"/merken/[id]">): Promise<Metadata> {
  const { id } = await params;
  const brand = getBrand(id);
  if (!brand) return {};
  return { title: brand.name, description: brand.description };
}

export default async function BrandPage({ params }: PageProps<"/merken/[id]">) {
  const { id } = await params;
  const brand = getBrand(id);
  if (!brand) notFound();

  const now = getRenderTime();
  const items = sortItems(getItemsByBrand(brand.id), "nieuw", now);
  const drops = getUpcomingDrops(now).filter((d) => d.brand === brand.id);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav className="mb-6 flex gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
        <Link href="/merken" className="hover:text-fg">Merken</Link>
        <span>/</span>
        <span className="text-fg">{brand.name}</span>
      </nav>

      <header className="border-b border-line pb-10">
        {brand.country && (
          <p className="font-mono text-xs uppercase tracking-wider text-muted">{brand.country}</p>
        )}
        <h1 className="mt-1 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-7xl">
          {brand.name}
        </h1>
        {brand.description && <p className="mt-5 max-w-2xl text-lg text-muted">{brand.description}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          {brand.instagram && (
            <a
              href={instagramUrl(brand.instagram)}
              target="_blank"
              rel="noreferrer"
              className="bg-fg px-5 py-3 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-85"
            >
              @{brand.instagram} ↗
            </a>
          )}
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noreferrer"
              className="border border-fg px-5 py-3 font-mono text-xs uppercase tracking-wider hover:bg-fg hover:text-bg"
            >
              Webshop ↗
            </a>
          )}
          <Link
            href={`/shop?merk=${brand.id}`}
            className="border border-line px-5 py-3 font-mono text-xs uppercase tracking-wider hover:border-fg"
          >
            Filter in shop
          </Link>
        </div>
      </header>

      {drops.length > 0 && (
        <section className="pt-10">
          <SectionHeading title="Upcoming drops" />
          <div className="grid gap-3 md:grid-cols-2">
            {drops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                brand={brand}
                itemCount={getItemsByDrop(drop.id).length}
                upcoming
              />
            ))}
          </div>
        </section>
      )}

      <section className="pt-10">
        <SectionHeading eyebrow={`${items.length} items`} title="Alle items" />
        {items.length > 0 ? (
          <ProductGrid items={items} now={now} />
        ) : (
          <p className="text-muted">Nog geen items van dit merk.</p>
        )}
      </section>
    </div>
  );
}
