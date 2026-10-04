import Link from "next/link";

export function SectionHeading({
  title,
  eyebrow,
  index,
  href,
  linkLabel = "View all",
}: {
  title: string;
  eyebrow?: string;
  /** Optioneel sectienummer, getoond als "No. 01" zoals in een catalogus. */
  index?: number;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-fg pb-3">
      <div className="flex items-end gap-4">
        {index !== undefined && (
          <span className="pb-1.5 font-mono text-[11px] tracking-wider text-accent">
            No.&nbsp;{String(index).padStart(2, "0")}
          </span>
        )}
        <div>
          {eyebrow && (
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted">{eyebrow}</p>
          )}
          <h2 className="font-display text-3xl leading-none tracking-tight sm:text-4xl">{title}</h2>
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 font-mono text-[11px] uppercase tracking-wider underline-offset-4 hover:text-accent hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
