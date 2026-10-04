"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/cn";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?new=1", label: "New" },
  { href: "/drops", label: "Drops" },
  { href: "/brands", label: "Brands" },
];

export function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onlyNew = searchParams.get("new") === "1";

  const isActive = (href: string) => {
    if (href === "/shop") return pathname === "/shop" && !onlyNew;
    if (href === "/shop?new=1") return pathname === "/shop" && onlyNew;
    return pathname.startsWith(href);
  };

  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "shrink-0 px-2 py-1 font-mono text-xs uppercase tracking-wider transition-colors",
            isActive(link.href) ? "bg-fg text-bg" : "hover:bg-tile",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/** Variant zonder actieve state, als fallback zolang de zoekparameters nog niet bekend zijn. */
export function NavLinksFallback() {
  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 px-2 py-1 font-mono text-xs uppercase tracking-wider hover:bg-tile"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
