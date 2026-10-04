"use client";

import { cn } from "@/lib/cn";
import { formatCountdown } from "@/lib/format";
import { useNow } from "@/lib/use-now";

export function Countdown({
  to,
  className,
  endedLabel = "Live now",
}: {
  to: string;
  className?: string;
  endedLabel?: string;
}) {
  const now = useNow();
  const diff = Date.parse(to) - (now ?? 0);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {now === null ? "--d --h --m --s" : diff > 0 ? formatCountdown(diff) : endedLabel}
    </span>
  );
}
