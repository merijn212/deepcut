import Link from "next/link";

import { siteConfig } from "@/config/site";
import { instagramUrl } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-band text-band-fg">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-12 sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="max-w-md">
          <p className="font-mono text-[11px] uppercase tracking-wider text-band-accent">About</p>
          <p className="mt-2 text-sm">{siteConfig.tagline}</p>
          <p className="mt-4 text-xs opacity-70">
            Checkout happens on each brand’s own store. Prices and stock may change, so always
            check the brand’s site.
          </p>
        </div>
        <nav className="flex flex-col gap-2 font-mono text-xs uppercase tracking-wider">
          <Link href="/shop" className="hover:text-band-accent">Shop</Link>
          <Link href="/shop?new=1" className="hover:text-band-accent">New</Link>
          <Link href="/drops" className="hover:text-band-accent">Drops</Link>
          <Link href="/brands" className="hover:text-band-accent">Brands</Link>
          {siteConfig.instagram && (
            <a href={instagramUrl(siteConfig.instagram)} className="hover:text-band-accent" target="_blank" rel="noreferrer">
              Instagram ↗
            </a>
          )}
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-7xl overflow-hidden px-4 sm:px-6">
        <p
          aria-hidden
          className="pb-[0.12em] font-display text-[26vw] leading-[0.85] italic tracking-tight select-none lg:text-[18rem]"
        >
          {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
