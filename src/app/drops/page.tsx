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
  description: "Upcoming releases from independent labels, with a live countdown.",
};

export default function DropsPage() {
  const now = getRenderTime();
  const upcoming = getUpcomingDrops(now);
  const past = getPastDrops(now);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10">
      <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Drops</h1>
      <p className="mt-2 max-w-xl text-muted">
        What’s dropping soon, with a live countdown. Times in Amsterdam time (CET/CEST).
      </p>

      <section className="pt-10">
        <SectionHeading eyebrow={`${upcoming.length} scheduled`} title="Upcoming" />
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
            No drops scheduled yet. Check back soon.
          </p>
        )}
      </section>

      {past.length > 0 && (
        <section className="pt-14">
          <SectionHeading title="Past drops" />
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
