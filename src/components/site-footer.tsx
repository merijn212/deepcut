import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { instagramUrl } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="max-w-md">
          <p className="text-lg font-semibold tracking-[-0.04em]">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-muted">{siteConfig.tagline}</p>
          <p className="mt-4 text-xs text-muted">
            Checkout happens on each brand’s own store. Prices and stock may change, so always
            check the brand’s site.
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/shop" className="hover:underline">Shop</Link>
          <Link href="/shop?new=1" className="hover:underline">New</Link>
          <Link href="/drops" className="hover:underline">Drops</Link>
          <Link href="/brands" className="hover:underline">Brands</Link>
          {siteConfig.instagram && (
            <a href={instagramUrl(siteConfig.instagram)} className="hover:underline" target="_blank" rel="noreferrer">
              Instagram<ArrowUpRight aria-hidden className="ml-1 inline size-[1.1em] align-[-0.2em]" strokeWidth={1.75} />
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
