import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { isOnSale } from "@/lib/status";

export function Price({
  price,
  compareAtPrice,
  className,
}: {
  price: number;
  compareAtPrice?: number;
  className?: string;
}) {
  const sale = isOnSale({ price, compareAtPrice });
  return (
    <span className={cn("whitespace-nowrap font-mono tabular-nums", className)}>
      {sale && <s className="mr-1.5 text-muted">{formatPrice(compareAtPrice!)}</s>}
      {formatPrice(price)}
    </span>
  );
}
