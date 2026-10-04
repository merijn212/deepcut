import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/config/site";
import { getRenderTime } from "@/lib/catalog";
import "./globals.css";

// Archivo voor lopende tekst, Instrument Serif voor koppen en IBM Plex Mono voor labels.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Statuses als "Nieuw" en "Binnenkort" hangen af van de tijd; pagina's worden
// daarom elk uur opnieuw opgebouwd. Countdowns lopen live in de browser.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name}: niche labels & drops`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const now = getRenderTime();

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrumentSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader now={now} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
