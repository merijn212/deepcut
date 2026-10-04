import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Productfoto in een vast kader, of een nette placeholder zolang er nog geen foto is.
 *
 * Merken fotograferen allemaal anders (los op wit, op een grijze studiomuur, buiten). Om
 * dat gelijk te trekken staat elke foto op dezelfde zachte, licht verlopende achtergrond,
 * in een vlak met dezelfde verhouding als het kader (inset in procenten), zodat er overal
 * evenveel lucht omheen zit. De foto wordt nooit bijgesneden (object-contain), krijgt
 * afgeronde hoeken die meeschalen met het formaat (cqw) en een witte achtergrond valt weg
 * in het kader (mix-blend-multiply). De achtergrond zit op dit element zelf, zodat multiply
 * ook werkt als `className` een opacity of transform toevoegt. Afronding en hover van de
 * buitenkant regelt de plek waar de foto staat.
 */
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
      <div
        className={cn(
          "@container absolute inset-0 bg-[linear-gradient(to_bottom,var(--frame),var(--frame-2))]",
          className,
        )}
      >
        <div className="absolute inset-[6%] overflow-hidden rounded-[clamp(2px,1.6cqw,8px)]">
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            preload={preload}
            className="object-contain mix-blend-multiply"
          />
        </div>
      </div>
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
        Photo soon
      </span>
    </div>
  );
}
