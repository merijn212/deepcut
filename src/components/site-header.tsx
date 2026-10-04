import Link from "next/link";
import { Suspense } from "react";

import { siteConfig } from "@/config/site";
import { getBrand, getUpcomingDrops } from "@/lib/catalog";
import { Countdown } from "./countdown";
import { NavLinks, NavLinksFallback } from "./nav-links";

export function SiteHeader({ now }: { now: number }) {
  const nextDrop = getUpcomingDrops(now)[0];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      {nextDrop && (
        <Link
          href={`/drops/${nextDrop.id}`}
          className="flex items-center justify-center gap-2 bg-fg px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-wider text-bg"
        >
          <span className="truncate">
            <span className="hidden sm:inline">Next drop: </span>
            {getBrand(nextDrop.brand)?.name} · {nextDrop.title}
          </span>
          <span className="shrink-0 whitespace-nowrap text-accent">
            <Countdown to={nextDrop.date} />
          </span>
        </Link>
      )}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-black uppercase tracking-tighter">
          {siteConfig.name}
        </Link>
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}
