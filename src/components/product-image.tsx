import Image from "next/image";

import { cn } from "@/lib/cn";

/** Productfoto, of een nette placeholder zolang er nog geen foto is. */
export function ProductImage({
  src,
  alt,
  label,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  preload,
  className,
}: {
  src?: string;
  alt: string;
  label: string;
  sizes?: string;
  preload?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "absolute inset-0 flex items-end justify-between bg-tile p-3 text-muted",
        "bg-[repeating-linear-gradient(135deg,transparent_0_14px,color-mix(in_oklab,var(--line)_55%,transparent)_14px_15px)]",
        className,
      )}
    >
      <span className="truncate font-mono text-[10px] uppercase tracking-wider">{label}</span>
      <span className="hidden shrink-0 pl-2 font-mono text-[10px] uppercase tracking-wider sm:inline">
        Foto volgt
      </span>
    </div>
  );
}
