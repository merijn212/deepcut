import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Countdown } from "@/components/countdown";
import { ProductGrid } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getBrand, getDrop, getDrops, getItemsByDrop, getRenderTime } from "@/lib/catalog";
import { sortItems } from "@/lib/filters";
import { formatDateTime, formatLongDate, instagramUrl } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDrops().map((drop) => ({ id: drop.id }));
}

export async function generateMetadata({ params }: PageProps<"/drops/[id]">): Promise<Metadata> {
  const { id } = await params;
  const drop = getDrop(id);
  if (!drop) return {};
  return {
    title: `${drop.title} · ${getBrand(drop.brand)?.name}`,
    description: drop.description,
  };
}

export default async function DropPage({ params }: PageProps<"/drops/[id]">) {
  const { id } = await params;
  const drop = getDrop(id);
  if (!drop) notFound();

  const now = getRenderTime();
  const brand = getBrand(drop.brand)!;
  const upcoming = Date.parse(drop.date) > now;
  const items = sortItems(getItemsByDrop(drop.id), "price-desc", now);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav className="mb-6 flex gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
        <Link href="/drops" className="hover:text-fg">Drops</Link>
        <span>/</span>
        <span className="text-fg">{drop.title}</span>
      </nav>

      <header className="border-b border-line pb-10">
        <Link
          href={`/brands/${brand.id}`}
          className="font-mono text-xs uppercase tracking-wider text-muted hover:text-fg"
        >
          {brand.name}
        </Link>
        <h1 className="mt-2 font-display text-6xl leading-[0.9] tracking-tight sm:text-8xl">
          {drop.title}
        </h1>
        {upcoming ? (
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-wider">{formatDateTime(drop.date)}</p>
            <Countdown to={drop.date} className="mt-1 block text-3xl text-accent sm:text-5xl" />
          </div>
        ) : (
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-muted">
            Dropped {formatLongDate(drop.date)}
          </p>
        )}
        {drop.description && <p className="mt-6 max-w-2xl text-lg text-muted">{drop.description}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          {drop.url && (
            <a
              href={drop.url}
              target="_blank"
              rel="noreferrer"
              className="bg-fg px-5 py-3 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-85"
            >
              {upcoming ? "Go to the drop" : "View at the brand"} ↗
            </a>
          )}
          {brand.instagram && (
            <a
              href={instagramUrl(brand.instagram)}
              target="_blank"
              rel="noreferrer"
              className="border border-fg px-5 py-3 font-mono text-xs uppercase tracking-wider hover:bg-fg hover:text-bg"
            >
              @{brand.instagram} ↗
            </a>
          )}
        </div>
      </header>

      <section className="pt-10">
        <SectionHeading title={upcoming ? "In this drop" : "From this drop"} />
        {items.length > 0 ? (
          <ProductGrid items={items} now={now} />
        ) : (
          <p className="text-muted">Items from this drop will be added soon.</p>
        )}
      </section>
    </div>
  );
}
