import Link from "next/link";
import { Suspense } from "react";

import { siteConfig } from "@/config/site";
import { getBrand, getBrands, getUpcomingDrops } from "@/lib/catalog";
import { Countdown } from "./countdown";
import { NavLinks, NavLinksFallback } from "./nav-links";

export function SiteHeader({ now }: { now: number }) {
  const nextDrop = getUpcomingDrops(now)[0];

  return (
    <header className="sticky top-0 z-40 border-b border-fg/80 bg-bg/92 backdrop-blur">
      {nextDrop ? (
        <Link
          href={`/drops/${nextDrop.id}`}
          className="flex items-center justify-center gap-2 bg-band px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-wider text-band-fg"
        >
          <span className="truncate">
            <span className="hidden sm:inline">Next drop: </span>
            {getBrand(nextDrop.brand)?.name} · {nextDrop.title}
          </span>
          <span className="shrink-0 whitespace-nowrap text-band-accent">
            <Countdown to={nextDrop.date} />
          </span>
        </Link>
      ) : (
        <BrandTicker />
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-display text-[1.75rem] leading-none italic tracking-tight">
            {siteConfig.name}
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted md:inline">
            Niche labels · Curated from Instagram
          </span>
        </Link>
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}

/** Doorlopende band met alle merken; verschijnt als er geen aankomende drop is. */
function BrandTicker() {
  const brands = getBrands();
  const words = [
    ...brands.map((brand) => brand.name),
    "Checkout at the source",
    "No middlemen",
    "Small runs only",
  ];
  const row = (hidden?: boolean) => (
    <span aria-hidden={hidden} className="flex shrink-0 items-center">
      {words.map((word) => (
        <span key={word} className="flex items-center">
          <span className="px-4">{word}</span>
          <span className="text-band-accent">✦</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden bg-band py-1.5 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap text-band-fg">
      <div className="marquee flex w-max">
        {row()}
        {row(true)}
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
