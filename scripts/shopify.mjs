// Gedeelde Shopify-hulpfuncties voor de voorraadcheck: productdata ophalen, maten
// normaliseren en de andere kleuren van een item in de shop van het merk vinden.

const USER_AGENT = "DeepcutStockCheck/1.0";

const SIZE_ALIASES = {
  XXS: ["XXS", "2XS", "XXSMALL"],
  XS: ["XS", "XSMALL", "EXTRASMALL"],
  S: ["S", "SMALL", "SM"],
  M: ["M", "MEDIUM", "MED"],
  L: ["L", "LARGE", "LG"],
  XL: ["XL", "XLARGE", "EXTRALARGE"],
  XXL: ["XXL", "2XL", "XXLARGE"],
  XXXL: ["XXXL", "3XL", "XXXLARGE"],
};
const ALIAS_TO_SIZE = new Map(
  Object.entries(SIZE_ALIASES).flatMap(([size, aliases]) => aliases.map((alias) => [alias, size])),
);

/** "X-Large", "x large" en "XL" worden allemaal "XL"; "28 R" wordt "28R". */
export function normalizeSize(value) {
  const compact = String(value).toUpperCase().replace(/[\s\-_.]/g, "");
  return ALIAS_TO_SIZE.get(compact) ?? compact;
}

const SIZE_OPTION = /size|maat|størrelse|storlek|größe|taille|talla/i;
const COLOR_OPTION = /colou?r|farve|färg|farbe|couleur|kleur/i;

function optionNames(data) {
  return (data.options ?? []).map((option) => (typeof option === "string" ? option : option.name) ?? "");
}

function optionValue(variant, index) {
  return variant.options?.[index] ?? variant[`option${index + 1}`];
}

async function fetchJson(url) {
  let response;
  for (let attempt = 1; ; attempt++) {
    try {
      response = await fetch(url, {
        headers: { accept: "application/json", "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      if (attempt >= 3) return { error: `niet bereikbaar (${error.message})` };
    }
    if (attempt >= 3) return { error: `HTTP ${response.status}` };
    await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
  }
  if (response.status === 404) return { error: "pagina niet gevonden (404), mogelijk offline gehaald" };
  if (!response.ok) return { error: `HTTP ${response.status}` };
  const data = await response.json().catch(() => undefined);
  return data ? { data } : { error: "geen geldige JSON" };
}

/** Productlink zonder query/hash, of undefined als het geen Shopify-productlink is. */
function productLink(url) {
  const clean = new URL(url);
  clean.search = "";
  clean.hash = "";
  clean.pathname = clean.pathname.replace(/\/$/, "");
  return /\/products\/[^/]+$/.test(clean.pathname) ? clean : undefined;
}

const dataOrigins = new Map();

/**
 * Sommige merken draaien een eigen (headless) storefront op hun domein, bijv. Shopify
 * Hydrogen. Daar bestaat `<url>.js` niet, maar de pagina noemt wel het eigen
 * `<shop>.myshopify.com`-adres, waar de productdata gewoon staat. Geeft dat adres terug,
 * of undefined. Eén keer per shop opgezocht.
 */
async function myshopifyOrigin(link) {
  if (!dataOrigins.has(link.origin)) {
    dataOrigins.set(
      link.origin,
      (async () => {
        try {
          const response = await fetch(link, {
            headers: { "user-agent": USER_AGENT },
            signal: AbortSignal.timeout(20_000),
          });
          if (!response.ok) return undefined;
          const match = /\b([a-z0-9][a-z0-9-]*)\.myshopify\.com\b/.exec(await response.text());
          const origin = match && `https://${match[1]}.myshopify.com`;
          return origin && origin !== link.origin ? origin : undefined;
        } catch {
          return undefined;
        }
      })(),
    );
  }
  return dataOrigins.get(link.origin);
}

/** De productlink op het adres waar de Shopify-data staat (zelfde pad, zonder taal/regio). */
function onOrigin(link, origin) {
  return new URL(link.pathname.slice(link.pathname.lastIndexOf("/products/")), origin);
}

export async function fetchShopifyProduct(url) {
  const clean = productLink(url);
  if (!clean) return { skip: "geen Shopify-productlink (/products/...)" };
  const jsUrl = new URL(clean);
  jsUrl.pathname += ".js";
  let result = await fetchJson(jsUrl);
  if (result.error || !Array.isArray(result.data.variants)) {
    const origin = await myshopifyOrigin(clean);
    if (origin) {
      const fallback = onOrigin(jsUrl, origin);
      const retry = await fetchJson(fallback);
      if (!retry.error && Array.isArray(retry.data.variants)) return { data: retry.data, origin };
    }
  }
  if (result.error) return result;
  if (!Array.isArray(result.data.variants)) return { skip: "geen Shopify-productdata" };
  return { data: result.data };
}

/** Geeft per genormaliseerde maat terug of er nog minstens één variant van leverbaar is. */
export function sizeAvailability(data, variants = data.variants) {
  const options = optionNames(data);
  let index = options.findIndex((name) => SIZE_OPTION.test(name));
  if (index === -1 && options.length === 1) index = 0;
  if (index === -1) return undefined;

  const available = new Map();
  for (const variant of variants) {
    const value = optionValue(variant, index);
    if (value == null) continue;
    const key = normalizeSize(value);
    available.set(key, (available.get(key) ?? false) || Boolean(variant.available));
  }
  return available;
}

/** De maten uit `sizes` die volgens de shop op zijn. Onbekende maten houden hun oude status. */
export function soldOutSizesFor(sizes, availability, current = []) {
  if (!availability) return current.filter((size) => sizes.includes(size));
  return sizes.filter((size) => {
    const known = availability.get(normalizeSize(size));
    return known === undefined ? current.includes(size) : !known;
  });
}

/** Shopify geeft "//cdn.shopify.com/...?v=123"; wij bewaren "https://cdn.shopify.com/...". */
export function cleanImageUrl(src) {
  const url = new URL(src.startsWith("//") ? `https:${src}` : src);
  url.searchParams.delete("v");
  url.searchParams.delete("width");
  if (/\.heic$/i.test(url.pathname)) url.searchParams.set("format", "jpg");
  return url.toString();
}

// ---------------------------------------------------------------------------
// Kleuren

// Woorden in kleurnamen uit shops, gekoppeld aan COLORS in src/data/taxonomy.ts.
// Langere namen eerst, zodat "Baby Blue" niet als "Blue" telt.
const COLOR_WORDS = [
  ["light-blue", ["baby blue", "light blue", "sky blue", "powder blue", "ice blue"]],
  ["white", ["off white", "off-white"]],
  ["navy", ["navy"]],
  ["black", ["black", "jet"]],
  ["white", ["white", "optic"]],
  ["cream", ["cream", "creme", "ecru", "ivory", "vanilla"]],
  ["grey", ["grey", "gray", "slate", "charcoal", "ash", "heather", "graphite", "silver"]],
  ["beige", ["beige", "sand", "oat", "oatmeal", "stone", "khaki", "tan", "camel", "taupe", "natural"]],
  ["brown", ["brown", "walnut", "chocolate", "coffee", "mocha", "espresso", "tobacco"]],
  ["green", ["green", "olive", "pistachio", "sage", "forest", "moss", "khaki green", "mint"]],
  ["blue", ["blue", "denim", "indigo", "cobalt", "royal"]],
  ["red", ["red", "burgundy", "bordeaux", "wine", "cherry", "maroon"]],
  ["pink", ["pink", "rose", "blush"]],
  ["purple", ["purple", "mauve", "lilac", "lavender", "plum", "violet"]],
  ["yellow", ["yellow", "mustard", "lemon", "butter"]],
  ["orange", ["orange", "rust", "terracotta"]],
];

/** "Slate Grey Check" wordt "grey"; het kleurwoord dat het eerst in de naam staat wint. */
export function guessColor(name) {
  const text = ` ${name.toLowerCase().replace(/[^a-z]+/g, " ")} `;
  let best;
  for (const [color, words] of COLOR_WORDS) {
    for (const word of words) {
      const at = text.indexOf(` ${word.replace(/-/g, " ")} `);
      if (at === -1) continue;
      if (!best || at < best.at || (at === best.at && word.length > best.length)) {
        best = { color, at, length: word.length };
      }
    }
  }
  return best?.color;
}

function titleCase(value) {
  return value.toLowerCase().replace(/(^|[\s/-])(\p{L})/gu, (_, sep, char) => sep + char.toUpperCase());
}

/**
 * "Fatigue Jacket - Sand" wordt { base: "Fatigue Jacket", color: "Sand" }. Een streepje
 * zonder spaties hoort bij de kleur: "Baggy Denim - Light-Wash Painter".
 */
export function splitColorTitle(title) {
  const match = /^(.+?)\s+[-–—|/]\s+((?:(?!\s[-–—|/]\s).)+)$/.exec(title.trim());
  return match ? { base: match[1].trim(), color: match[2].trim() } : undefined;
}

const shopListings = new Map();

/** Alle producten van een Shopify-shop (via /products.json), één keer per shop opgehaald. */
async function shopProducts(origin) {
  if (!shopListings.has(origin)) {
    shopListings.set(
      origin,
      (async () => {
        const all = [];
        for (let page = 1; page <= 10; page++) {
          const result = await fetchJson(`${origin}/products.json?limit=250&page=${page}`);
          if (result.error || !Array.isArray(result.data.products)) return all.length ? all : undefined;
          all.push(...result.data.products);
          if (result.data.products.length < 250) break;
        }
        return all;
      })(),
    );
  }
  return shopListings.get(origin);
}

/**
 * Zoekt alle kleuren van een item in de shop. Twee manieren waarop shops dat doen:
 * - één product met een kleuroptie (Color/Colour): elke kleur wordt een link met ?variant=;
 * - een los product per kleur met dezelfde naam, bijv. "Work Pant - Black" en "Work Pant - Sand".
 *
 * Geeft `{ current, others }` terug: de kleur van de link zelf en de andere kleuren, elk met
 * `name`, `url`, `images` en `availability` (per maat). Geen kleuren gevonden: undefined.
 */
export async function findColorways(url, data) {
  const options = optionNames(data);
  const colorIndex = options.findIndex((name) => COLOR_OPTION.test(name));
  if (colorIndex !== -1) return colorwaysFromOption(url, data, colorIndex);
  return colorwaysFromSiblings(url, data);
}

function colorwaysFromOption(url, data, colorIndex) {
  const link = productLink(url);
  const variantId = new URL(url).searchParams.get("variant");
  const byColor = new Map();
  for (const variant of data.variants) {
    const value = optionValue(variant, colorIndex);
    if (value == null) continue;
    if (!byColor.has(value)) byColor.set(value, []);
    byColor.get(value).push(variant);
  }
  if (byColor.size < 2) return undefined;

  const productImages = (data.images ?? []).map((image) => (typeof image === "string" ? image : image.src));
  const media = data.media ?? [];
  const colorways = [...byColor].map(([value, variants]) => {
    // Foto's: de foto's die aan de varianten hangen, plus foto's met de kleur in de alt-tekst.
    const images = [
      ...variants.map((variant) => variant.featured_image?.src),
      ...media.filter((item) => item.alt && item.alt.toLowerCase().includes(value.toLowerCase())).map((item) => item.src),
    ].filter(Boolean);
    const colorUrl = new URL(link);
    colorUrl.searchParams.set("variant", String(variants[0].id));
    return {
      name: titleCase(value),
      url: colorUrl.toString(),
      images: [...new Set((images.length ? images : productImages.slice(0, 1)).map(cleanImageUrl))],
      availability: sizeAvailability(data, variants),
      anyAvailable: variants.some((variant) => variant.available),
      variantIds: new Set(variants.map((variant) => String(variant.id))),
    };
  });
  const currentIndex = Math.max(
    0,
    colorways.findIndex((colorway) => variantId && colorway.variantIds.has(variantId)),
  );
  const [current] = colorways.splice(currentIndex, 1);
  return { current, others: colorways };
}

/** Laagste prijs van een product uit /products.json, in centen zoals in `<url>.js`. */
function lowestPrice(product) {
  const prices = (product.variants ?? []).map((variant) => Math.round(Number(variant.price) * 100));
  return prices.length ? Math.min(...prices) : undefined;
}

async function colorwaysFromSiblings(url, data) {
  const own = splitColorTitle(data.title ?? "");
  if (!own) return undefined;
  const link = productLink(url);
  let products = await shopProducts(link.origin);
  if (!products) {
    const origin = await myshopifyOrigin(link);
    if (origin) products = await shopProducts(origin);
  }
  if (!products) return undefined;

  const prefix = link.pathname.slice(0, link.pathname.lastIndexOf("/products/"));
  const toColorway = (product, name) => ({
    name: titleCase(name),
    url: `${link.origin}${prefix}/products/${product.handle}`,
    images: (product.images ?? []).map((image) => cleanImageUrl(image.src)),
    availability: sizeAvailability(product),
    anyAvailable: (product.variants ?? []).some((variant) => variant.available),
  });

  const others = [];
  for (const product of products) {
    if (product.handle === data.handle) continue;
    const parts = splitColorTitle(product.title ?? "");
    if (!parts || parts.base.toLowerCase() !== own.base.toLowerCase()) continue;
    // Een kleur heeft dezelfde prijs als het item (zie Colorway in src/data/types.ts). Kost
    // een "kleur" meer of minder, dan is het eigenlijk een ander item; die slaan we over.
    if (lowestPrice(product) !== data.price) continue;
    others.push(toColorway(product, parts.color));
  }
  if (others.length === 0) return undefined;
  return {
    current: {
      name: titleCase(own.color),
      url: link.toString(),
      base: own.base,
    },
    others,
  };
}

/** Varianten van het item zelf (alleen die van de eigen kleur als de shop een kleuroptie heeft). */
export function ownVariants(url, data) {
  const colorIndex = optionNames(data).findIndex((name) => COLOR_OPTION.test(name));
  const variantId = new URL(url).searchParams.get("variant");
  if (colorIndex === -1 || !variantId) return data.variants;
  const own = data.variants.find((variant) => String(variant.id) === variantId);
  if (!own) return data.variants;
  const value = optionValue(own, colorIndex);
  return data.variants.filter((variant) => optionValue(variant, colorIndex) === value);
}
