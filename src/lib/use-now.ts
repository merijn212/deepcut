"use client";

import { useSyncExternalStore } from "react";

// Gedeelde klok voor countdowns en tijdsafhankelijke status. Op de server (en tijdens
// hydratie) geeft de hook null terug, zodat er geen hydration mismatch ontstaat.

const listeners = new Set<() => void>();
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  now = Date.now();
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Huidige tijd, afgerond op `resolutionMs`; het component rendert alleen opnieuw als die waarde verandert. */
export function useNow(resolutionMs = 1000): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(now / resolutionMs) * resolutionMs,
    () => null,
  );
}
