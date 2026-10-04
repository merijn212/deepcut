# Deepcut

Gecureerde shop voor kleding van niche Instagram-merken. Bezoekers kunnen filteren op
type kleding, merk, maat, kleur, prijs en status, zien wat nieuw is en welke drops
eraan komen (met live countdown). Afrekenen gebeurt in de shop van het merk zelf: elk
item linkt door naar het merk.

Gebouwd met Next.js (App Router), TypeScript en Tailwind CSS. Er is geen database: alle
merken, items en drops staan in TypeScript-bestanden in `src/data/`.

## Lokaal draaien

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck
npm run build      # productie-build (faalt bij fouten in de data)
```

## Pagina's

| Route            | Wat                                                             |
| ---------------- | --------------------------------------------------------------- |
| `/`              | Home: upcoming drops, nieuw binnen, uitgelicht, types, merken   |
| `/shop`          | Alle items met filters, zoeken en sorteren (filters staan in de URL) |
| `/shop?new=1`    | Alleen nieuwe items                                             |
| `/product/[id]`  | Itempagina met foto's, maten, kleur en link naar de shop van het merk |
| `/drops`         | Upcoming en eerdere drops                                       |
| `/drops/[id]`    | Eén drop met countdown en de items erin                         |
| `/brands`        | Alle merken                                                     |
| `/brands/[id]`   | Merkpagina met Instagram, webshop, drops en items               |

Filterlinks kun je delen, bijvoorbeeld `/shop?category=hoodies&size=M&color=black`.

## Items toevoegen

### 1. Merk (`src/data/brands.ts`)

```ts
{
  id: "merknaam",                 // slug: kleine letters, cijfers, streepjes
  name: "Merknaam",
  instagram: "merknaam",          // handle zonder @
  website: "https://merknaam.com",
  country: "NL",
  description: "Korte omschrijving van het merk.",
}
```

### 2. Item (`src/data/products.ts`)

```ts
{
  id: "merknaam-boxy-hoodie-zwart", // uniek, komt in de URL
  name: "Boxy Hoodie",
  brand: "merknaam",                // id uit brands.ts
  category: "hoodies",              // zie CATEGORIES in src/data/taxonomy.ts
  price: 120,
  compareAtPrice: 150,              // optioneel: oude prijs, item krijgt "Sale"
  images: ["/items/merknaam/boxy-hoodie-1.jpg", "/items/merknaam/boxy-hoodie-2.jpg"],
  sizes: ["S", "M", "L", "XL"],
  soldOutSizes: ["S"],              // optioneel: worden doorgestreept
  colors: ["black"],                // zie COLORS in src/data/taxonomy.ts
  description: "Heavyweight hoodie met verlaagde schouders.",
  url: "https://merknaam.com/products/boxy-hoodie",
  addedAt: "2026-10-04",            // vandaag; bepaalt het "Nieuw"-label (met tijd mag ook)
  releaseAt: "2026-10-18T18:00:00+02:00", // optioneel: nog niet uit, dan "Binnenkort"
  drop: "merknaam-fw26",            // optioneel: id uit drops.ts (dan geldt de drop-datum)
  soldOut: false,                   // optioneel
  featured: true,                   // optioneel: tonen bij "Uitgelicht" op home
  tags: ["oversized", "heavyweight"], // optioneel: extra zoekwoorden
}
```

Status wordt automatisch bepaald:

- **Binnenkort**: `releaseAt` (of de datum van de drop) ligt in de toekomst.
- **Uitverkocht**: `soldOut: true`.
- **Nieuw**: beschikbaar en toegevoegd of gereleased in de laatste 14 dagen
  (`newItemDays` in `src/config/site.ts`).

### 3. Drop (`src/data/drops.ts`, optioneel)

```ts
{
  id: "merknaam-fw26",
  brand: "merknaam",
  title: "FW26 Capsule",
  date: "2026-10-18T18:00:00+02:00", // altijd met tijdzone (+02:00 zomer, +01:00 winter)
  description: "Wat er in de drop zit.",
  url: "https://merknaam.com",        // optioneel
}
```

Koppel items aan een drop met `drop: "merknaam-fw26"`.

### Foto's

Zet foto's in `public/items/<merk>/` en verwijs ernaar als `/items/<merk>/bestand.jpg`.
Staande foto's (4:5) passen het best. Externe URL's kan ook, maar dan moet het domein in
`next.config.ts` onder `images.remotePatterns` staan (`cdn.shopify.com` staat er al in).
Items zonder foto krijgen een placeholder.

### Controle

Bij `npm run dev` en `npm run build` wordt de data gecontroleerd: dubbele id's, onbekende
merken, drops of kleuren en ongeldige datums of URL's geven een duidelijke foutmelding.

Categorieën en kleuren pas je aan in `src/data/taxonomy.ts`; sitenaam, tagline en je eigen
Instagram in `src/config/site.ts`.

De site zelf is Engelstalig; teksten staan direct in de componenten in `src/app` en
`src/components`.

## Online zetten

Het makkelijkst via [Vercel](https://vercel.com/new): importeer de GitHub-repo, de standaard
instellingen werken. Pagina's worden elk uur opnieuw opgebouwd, zodat "Nieuw" en
"Binnenkort" vanzelf bijwerken; countdowns lopen live in de browser. Na elke push met nieuwe
items deployt Vercel automatisch.

## Automatisch bijwerken

**"Nieuw" verloopt vanzelf.** Een item is nieuw tot `newItemDays` (standaard 14) dagen na
`addedAt`, of na de release als die later is (`releaseAt` of de datum van de drop). Pas het
aantal dagen aan in `src/config/site.ts`. Omdat de pagina's elk uur opnieuw worden
opgebouwd, verdwijnt het label zonder dat je iets hoeft te pushen.

**Uitverkochte items verdwijnen vanzelf.** De GitHub Action `Stock check`
(`.github/workflows/stock-check.yml`) draait elke dag om 05:00 UTC en voert
`scripts/check-stock.mjs` uit. Die haalt voor elk item met een `url` de Shopify-productdata
op (`<url>.js`) en:

- verwijdert het item uit `products.ts` als het in geen enkele kleur meer leverbaar is;
- werkt `soldOutSizes` bij als losse maten op zijn of weer terug zijn ("SMALL" in de shop
  telt als "S" hier, enz.);
- zoekt de andere kleuren van het item in de shop en houdt `colorways` bij (zie hieronder);
- slaat items over die nog moeten droppen, geen `url` hebben of niet op Shopify staan;
- werkt ook bij merken met een eigen (headless) storefront, zoals No Maintenance: geeft
  `<url>.js` daar geen productdata, dan haalt de check die op bij het `myshopify.com`-adres
  dat op de productpagina staat. De link op de site blijft die naar de shop van het merk;
- verandert niets bij een fout of 404, maar zet die als waarschuwing in het rapport
  (Actions → Stock check → de run → Summary).

**Kleuren.** Veel shops verkopen hetzelfde item in meerdere kleuren, als kleuroptie binnen
één product of als losse producten met dezelfde naam ("Work Pant - Black", "Work Pant - Sand").
De voorraadcheck vindt die kleuren en zet ze in `colorways` (naam, kleur voor de filter, link,
foto's en uitverkochte maten per kleur). Het item zelf krijgt `colorName` en de kleur
verdwijnt uit de naam ("Work Pant"). Losse producten met een andere prijs tellen niet als
kleur, want een kleur heeft dezelfde prijs als het item. Nieuwe kleuren komen er vanzelf bij, uitverkochte kleuren
gaan eraf. Klopt een geraden kleur niet (bijv. "Mauve" als `purple`), pas `color` dan gewoon
aan: bestaande namen, kleuren en foto's laat de check staan. Een nieuw item met kleuren vul
je direct met `npm run stock`.

Als er iets verandert, draaien lint, typecheck en build; daarna commit de Action naar
`main` en deployt de site opnieuw. Instellen:

- **Hoe vaak**: de `cron`-regel in de workflow (bijv. `"0 */6 * * *"` voor elke 6 uur).
- **Laten staan in plaats van verwijderen**: zet `REMOVE_SOLD_OUT` op `"false"`; items
  krijgen dan `soldOut: true`.
- **Handmatig draaien**: Actions → Stock check → Run workflow (met "dry run" om alleen te
  kijken), of lokaal `npm run stock -- --dry-run`.

## Structuur

```
src/
  app/          pagina's (home, shop, product, drops, merken)
  components/   UI-componenten; shop/ bevat de filters
  config/       site-instellingen
  data/         merken, items, drops, categorieën en kleuren  ← hier voeg je dingen toe
  lib/          catalogus + validatie, filterlogica, status, formattering
scripts/        voorraadcheck (draait dagelijks via .github/workflows/stock-check.yml)
```
