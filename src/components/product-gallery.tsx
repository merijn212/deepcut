"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { ProductImage } from "./product-image";

export function ProductGallery({
  images,
  alt,
  label,
}: {
  images: string[];
  alt: string;
  label: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[4/5] overflow-hidden bg-tile">
        <ProductImage
          src={images[active]}
          alt={alt}
          label={label}
          sizes="(min-width: 1024px) 50vw, 100vw"
          preload={active === 0}
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-[4/5] overflow-hidden bg-tile ring-offset-2 ring-offset-bg",
                i === active ? "ring-1 ring-fg" : "opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={src} alt="" label="" sizes="10vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
