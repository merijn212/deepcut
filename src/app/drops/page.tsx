import type { Metadata } from "next";

import { DropCard } from "@/components/drop-card";
import { SectionHeading } from "@/components/section-heading";
import {
  getBrand,
  getItemsByDrop,
  getPastDrops,
  getRenderTime,
  getUpcomingDrops,
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Drops",
  description: "Upcoming drops van niche Instagram-merken, met live countdown.",
};

export default function DropsPage() {
  const now = getRenderTime();
  const upcoming = getUpcomingDrops(now);
  const past = getPastDrops(now);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10">
      <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Drops</h1>
      <p className="mt-2 max-w-xl text-muted">
        Wat er binnenkort uitkomt, met countdown. Tijden in Nederlandse tijd.
      </p>

      <section className="pt-10">
        <SectionHeading eyebrow={`${upcoming.length} gepland`} title="Upcoming" />
        {upcoming.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                brand={getBrand(drop.brand)}
                itemCount={getItemsByDrop(drop.id).length}
                upcoming
              />
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-line px-6 py-10 text-center text-muted">
            Nog geen drops gepland. Check binnenkort weer.
          </p>
        )}
      </section>

      {past.length > 0 && (
        <section className="pt-14">
          <SectionHeading title="Eerdere drops" />
          <div className="grid gap-3 md:grid-cols-2">
            {past.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                brand={getBrand(drop.brand)}
                itemCount={getItemsByDrop(drop.id).length}
                upcoming={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
