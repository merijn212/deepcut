@AGENTS.md

# Merrie-fit

Gecureerde shop voor niche Instagram-kledingmerken. UI-teksten zijn Nederlands.

- Alle content staat in `src/data/` (`brands.ts`, `products.ts`, `drops.ts`); er is geen
  database of CMS. Veldenuitleg staat in `README.md` en in de JSDoc van `src/data/types.ts`.
- Categorieën en kleuren zijn vaste lijsten in `src/data/taxonomy.ts`.
- `src/lib/catalog.ts` is server-only en valideert de data bij het laden. Client components
  krijgen `CatalogItem[]` als props en gebruiken de pure helpers in `src/lib/status.ts`
  en `src/lib/filters.ts`.
- Shopfilters staan in de URL (`categorie`, `merk`, `maat`, `kleur`, `status`, `nieuw`,
  `sale`, `min`, `max`, `sort`, `q`) en worden bijgewerkt met `window.history.replaceState`.
- Tijdsafhankelijke status ("Nieuw", "Binnenkort") wordt op de server bepaald via
  `getRenderTime()` (revalidate elk uur, zie `app/layout.tsx`); countdowns gebruiken `useNow()`.
- Afrekenen gebeurt bij het merk: items linken naar `url` (of de website van het merk).

Na wijzigingen: `npm run check` en `npm run build`.
