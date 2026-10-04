import { siteConfig } from "@/config/site";

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

// Vaste tijdzone, zodat server (UTC) en browser hetzelfde tonen.
const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  day: "numeric",
  month: "short",
  timeZone: siteConfig.timeZone,
});

const dateTimeFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: siteConfig.timeZone,
});

const longDateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: siteConfig.timeZone,
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return longDateFormatter.format(new Date(iso));
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return days > 0
    ? `${days}d ${pad(hours)}u ${pad(minutes)}m ${pad(seconds)}s`
    : `${pad(hours)}u ${pad(minutes)}m ${pad(seconds)}s`;
}

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}
