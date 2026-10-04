"use client";

import { ArrowUpRight } from "lucide-react";
import { createContext, useContext, useState } from "react";

import type { ResolvedColorway } from "@/lib/colorways";
import { cn } from "@/lib/cn";
import { ProductGallery } from "./product-gallery";
import { ProductImage } from "./product-image";

// De productpagina is een server component; alleen de delen die met de gekozen kleur
// meeveranderen (foto's, kleurstalen, maten en de shopknop) lezen de kleur uit deze context.

interface ColorwayState {
  colorways: ResolvedColorway[];
  index: number;
  select: (index: number) => void;
}

const ColorwayContext = createContext<ColorwayState | null>(null);

function useColorways(): ColorwayState & { current: ResolvedColorway } {
  const state = useContext(ColorwayContext);
  if (!state) throw new Error("Gebruik dit component binnen <ColorwayProvider>");
  return { ...state, current: state.colorways[state.index] };
}

export function ColorwayProvider({
  colorways,
  children,
}: {
  colorways: ResolvedColorway[];
  children: React.ReactNode;
}) {
  // Begin bij de eerste kleur die nog leverbaar is.
  const [index, setIndex] = useState(() => Math.max(0, colorways.findIndex((c) => !c.soldOut)));
  return (
    <ColorwayContext.Provider value={{ colorways, index, select: setIndex }}>
      {children}
    </ColorwayContext.Provider>
  );
}

export function ColorwayGallery({ alt, label }: { alt: string; label: string }) {
  const { current, index } = useColorways();
  // key: bij een andere kleur begint de galerij weer bij de eerste foto.
  return <ProductGallery key={index} images={current.images} alt={`${alt}, ${current.name}`} label={label} />;
}

export function ColorPicker() {
  const { colorways, index, current, select } = useColorways();
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = colorways[hovered ?? index];

  return (
    <div>
      <p className="mb-2 flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-wider text-muted">
        Colour
        <span className="font-sans text-sm normal-case tracking-normal text-fg">
          {shown.name}
          {shown.soldOut && <span className="text-muted">, sold out</span>}
        </span>
        <span className="ml-auto">{colorways.length} colours</span>
      </p>
      <ul className="flex flex-wrap gap-2" aria-label={`Colour: ${current.name}`}>
        {colorways.map((colorway, i) => (
          <li key={colorway.name}>
            <button
              type="button"
              onClick={() => select(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              aria-label={`${colorway.name}${colorway.soldOut ? " (sold out)" : ""}`}
              aria-pressed={i === index}
              className={cn(
                "relative block aspect-[4/5] w-14 overflow-hidden ring-offset-2 ring-offset-bg transition",
                i === index ? "ring-1 ring-fg" : "hover:ring-1 hover:ring-line",
              )}
            >
              <ProductImage
                src={colorway.images[0]}
                alt=""
                label=""
                sizes="56px"
                className={cn(colorway.soldOut && "opacity-40")}
              />
              {colorway.soldOut && (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),var(--muted)_50%,transparent_calc(50%+0.5px))]"
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SizeList({ sizes, soldOut }: { sizes: string[]; soldOut: boolean }) {
  const { current } = useColorways();
  return (
    <ul className="flex flex-wrap gap-1.5">
      {sizes.map((size) => {
        const out = soldOut || current.soldOut || current.soldOutSizes.includes(size);
        return (
          <li
            key={size}
            className={cn(
              "min-w-11 border border-line px-2.5 py-1.5 text-center font-mono text-xs uppercase",
              out && "text-muted line-through",
            )}
          >
            {size}
          </li>
        );
      })}
    </ul>
  );
}

export function ShopButton({ brandName, fallbackUrl }: { brandName: string; fallbackUrl?: string }) {
  const { colorways, current } = useColorways();
  const url = current.url ?? fallbackUrl;

  if (current.soldOut) {
    return (
      <span className="rounded-full border border-line px-6 py-3.5 text-center text-sm font-medium text-muted">
        Sold out in {current.name}
      </span>
    );
  }
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="rounded-full bg-fg px-6 py-3.5 text-center text-sm font-medium text-bg hover:opacity-85"
    >
      Shop {colorways.length > 1 ? `${current.name} ` : ""}at {brandName}
      <ArrowUpRight aria-hidden className="ml-1 inline size-[1.1em] align-[-0.2em]" strokeWidth={1.75} />
    </a>
  );
}
