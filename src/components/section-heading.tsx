import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function SectionHeading({
  title,
  eyebrow,
  href,
  linkLabel = "View all",
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-3">
      <div>
        {eyebrow && (
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group/link shrink-0 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          {linkLabel}
          <ArrowRight
            aria-hidden
            className="ml-1 inline size-[1.1em] align-[-0.2em] transition-transform duration-300 group-hover/link:translate-x-0.5"
            strokeWidth={1.75}
          />
        </Link>
      )}
    </div>
  );
}
