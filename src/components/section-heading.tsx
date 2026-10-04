import Link from "next/link";

export function SectionHeading({
  title,
  eyebrow,
  href,
  linkLabel = "Bekijk alles",
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
        <h2 className="text-xl font-semibold uppercase tracking-tight sm:text-2xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 font-mono text-[11px] uppercase tracking-wider underline-offset-4 hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
