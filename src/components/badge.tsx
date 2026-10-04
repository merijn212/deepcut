import { cn } from "@/lib/cn";
import type { ItemStatus } from "@/lib/status";

type Variant = "new" | "upcoming" | "sold-out" | "sale" | "outline";

const styles: Record<Variant, string> = {
  new: "bg-fg text-bg",
  upcoming: "bg-accent text-accent-fg",
  "sold-out": "bg-bg/85 text-muted",
  sale: "bg-bg text-fg ring-1 ring-fg",
  outline: "text-fg ring-1 ring-line",
};

export function Badge({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] uppercase leading-none tracking-wider",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

export function ItemBadges({
  status,
  isNew,
  onSale,
}: {
  status: ItemStatus;
  isNew: boolean;
  onSale: boolean;
}) {
  return (
    <>
      {status === "upcoming" && <Badge variant="upcoming">Binnenkort</Badge>}
      {status === "sold-out" && <Badge variant="sold-out">Uitverkocht</Badge>}
      {isNew && <Badge variant="new">Nieuw</Badge>}
      {onSale && status !== "sold-out" && <Badge variant="sale">Sale</Badge>}
    </>
  );
}
