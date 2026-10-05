import Image from "next/image";

import type { DropPreview } from "@/data/types";

/**
 * Eerste foto's van een drop (meestal uit de Instagram-post van het merk), zolang er nog geen
 * items zijn. Anders dan productfoto's zijn dit sfeerbeelden: ze vullen het vlak (object-cover)
 * in plaats van in het vaste productkader te staan.
 */
export function DropPreviews({ previews, label }: { previews: DropPreview[]; label: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-4">
      {previews.map((preview, i) => (
        <li key={preview.src} className="reveal">
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-tile">
            <Image
              src={preview.src}
              alt={preview.caption ? `${label}: ${preview.caption}` : label}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              preload={i < 2}
              className="object-cover"
            />
          </div>
          {preview.caption && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">{preview.caption}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
