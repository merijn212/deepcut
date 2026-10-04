import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ItemBadges } from "@/components/badge";
import { Countdown } from "@/components/countdown";
import { Price } from "@/components/price";
import { ProductGrid } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { SectionHeading } from "@/components/section-heading";
import { COLORS, compareSizes, getCategoryLabel } from "@/data/taxonomy";
import {
  getBrand,
  getCatalog,
  getDrop,
  getItem,
  getItemsByBrand,
  getRenderTime,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { sortItems } from "@/lib/filters";
import { formatDateTime, instagramUrl } from "@/lib/format";
import { getStatus, isNew, isOnSale } from "@/lib/status";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalog().map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = getItem(id);
  if (!item) return {};
  return {
    title: `${item.name} · ${item.brandName}`,
    description: item.description ?? `${item.name} by ${item.brandName}`,
    openGraph: item.images?.[0] ? { images: [item.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  const now = getRenderTime();
  const brand = getBrand(item.brand)!;
  const drop = item.drop ? getDrop(item.drop) : undefined;
  const status = getStatus(item, now);
  const sizes = [...(item.sizes ?? [])].sort(compareSizes);
  const categoryLabel = getCategoryLabel(item.category);
  const shopUrl = item.url ?? brand.website;
  const more = sortItems(
    getItemsByBrand(brand.id).filter((other) => other.id !== item.id),
    "newest",
    now,
  ).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav className="mb-6 flex flex-wrap gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
        <Link href="/shop" className="hover:text-fg">Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${item.category}`} className="hover:text-fg">{categoryLabel}</Link>
        <span>/</span>
        <span className="text-fg">{item.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          images={item.images ?? []}
          alt={`${item.brandName} ${item.name}`}
          label={categoryLabel}
        />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap gap-1">
            <ItemBadges status={status} isNew={isNew(item, now)} onSale={isOnSale(item)} />
          </div>
          <Link
            href={`/brands/${brand.id}`}
            className="mt-3 inline-block font-mono text-xs uppercase tracking-wider text-muted hover:text-fg"
          >
            {brand.name}
          </Link>
          <h1 className="mt-1 text-3xl font-black uppercase leading-none tracking-tighter sm:text-4xl">
            {item.name}
          </h1>
          <Price price={item.price} compareAtPrice={item.compareAtPrice} className="mt-4 block text-lg" />

          {status === "upcoming" && item.releaseAt && (
            <div className="mt-6 border border-accent p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {drop ? `Part of the drop: ${drop.title}` : "Release"}
              </p>
              <p className="mt-1 font-medium">{formatDateTime(item.releaseAt)}</p>
              <Countdown to={item.releaseAt} className="mt-1 block text-xl text-accent" />
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">Sizes</p>
              <ul className="flex flex-wrap gap-1.5">
                {sizes.map((size) => {
                  const out = status === "sold-out" || item.soldOutSizes?.includes(size);
                  return (
                    <li
                      key={size}
                      className={cn(
                        "min-w-11 border border-line px-2.5 py-1.5 text-center font-mono text-xs uppercase",
                        out && "text-muted line-through",
                      )}
                    >
                      {size}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {item.colors && item.colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">Colour</p>
              <ul className="flex flex-wrap gap-3">
                {item.colors.map((color) => (
                  <li key={color} className="flex items-center gap-1.5 text-sm">
                    <span
                      className="size-3.5 rounded-full ring-1 ring-line"
                      style={{ background: COLORS[color].swatch }}
                    />
                    {COLORS[color].label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.description && <p className="mt-6 max-w-prose leading-relaxed">{item.description}</p>}

          <div className="mt-8 flex flex-col gap-2">
            {status === "available" && shopUrl && (
              <a
                href={shopUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-fg px-5 py-3.5 text-center font-mono text-xs uppercase tracking-wider text-bg hover:opacity-85"
              >
                Shop at {brand.name} ↗
              </a>
            )}
            {status === "upcoming" && drop && (
              <Link
                href={`/drops/${drop.id}`}
                className="bg-accent px-5 py-3.5 text-center font-mono text-xs uppercase tracking-wider text-accent-fg hover:opacity-85"
              >
                View the drop
              </Link>
            )}
            {status === "sold-out" && (
              <span className="border border-line px-5 py-3.5 text-center font-mono text-xs uppercase tracking-wider text-muted">
                Sold out
              </span>
            )}
            {brand.instagram && (
              <a
                href={instagramUrl(brand.instagram)}
                target="_blank"
                rel="noreferrer"
                className="border border-fg px-5 py-3.5 text-center font-mono text-xs uppercase tracking-wider hover:bg-fg hover:text-bg"
              >
                {status === "upcoming" ? "Follow" : "View"} @{brand.instagram} on Instagram ↗
              </a>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            Checkout happens on the {brand.name} store. Check there for current price and stock.
          </p>
        </div>
      </div>

      {more.length > 0 && (
        <section className="pt-20">
          <SectionHeading title={`More from ${brand.name}`} href={`/brands/${brand.id}`} />
          <ProductGrid items={more} now={now} />
        </section>
      )}
    </div>
  );
}
