import Link from "next/link";

import { siteConfig } from "@/config/site";
import type { Brand, Drop } from "@/data/types";
import { cn } from "@/lib/cn";
import { formatDateTime, formatLongDate } from "@/lib/format";
import { Countdown } from "./countdown";

const { locale, timeZone } = siteConfig;
const dayFormatter = new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone });
const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short", timeZone });

export function DropCard({
  drop,
  brand,
  itemCount,
  upcoming,
}: {
  drop: Drop;
  brand?: Brand;
  itemCount: number;
  upcoming: boolean;
}) {
  const date = new Date(drop.date);

  return (
    <Link
      href={`/drops/${drop.id}`}
      className={cn(
        "group grid grid-cols-[auto_1fr] gap-4 border p-4 transition-colors sm:gap-6 sm:p-5",
        upcoming ? "border-fg hover:bg-tile" : "border-line hover:border-fg",
      )}
    >
      <div
        className={cn(
          "flex w-16 flex-col items-center justify-center py-2 sm:w-20",
          upcoming ? "bg-accent text-accent-fg" : "bg-tile text-muted",
        )}
      >
        <span className="font-display text-3xl leading-none tabular-nums sm:text-4xl">{dayFormatter.format(date)}</span>
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {monthFormatter.format(date).replace(".", "")}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{brand?.name}</p>
        <h3 className="font-display text-2xl leading-tight tracking-tight underline-offset-4 group-hover:underline">
          {drop.title}
        </h3>
        {drop.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{drop.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider">
          {upcoming ? (
            <>
              <span>{formatDateTime(drop.date)}</span>
              <Countdown to={drop.date} className="text-accent" />
            </>
          ) : (
            <span className="text-muted">Dropped {formatLongDate(drop.date)}</span>
          )}
          {itemCount > 0 && (
            <span className="text-muted">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
