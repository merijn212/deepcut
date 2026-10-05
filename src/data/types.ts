import type { CategoryId, ColorId } from "./taxonomy";

export interface Brand {
  /** Unieke slug, wordt gebruikt in de URL: /merken/<id> */
  id: string;
  name: string;
  /** Instagram-handle zonder @ */
  instagram?: string;
  /** Webshop van het merk */
  website?: string;
  /** Bijv. "NL", "BE", "DK" */
  country?: string;
  description?: string;
  /** Pad in /public (bijv. "/items/merk/logo.png") of externe URL */
  logo?: string;
}

export interface Product {
  /** Unieke slug, wordt gebruikt in de URL: /product/<id> */
  id: string;
  name: string;
  /** id van een merk uit brands.ts */
  brand: string;
  category: CategoryId;
  /** Prijs in euro's */
  price: number;
  /** Oorspronkelijke prijs als het item in de sale is */
  compareAtPrice?: number;
  /** Paden in /public (bijv. "/items/merk/hoodie-1.jpg") of externe URL's */
  images?: string[];
  sizes?: string[];
  /** Maten die op zijn (worden doorgestreept) */
  soldOutSizes?: string[];
  colors?: ColorId[];
  /** Naam van de kleur van dit item zoals de shop hem noemt, bijv. "Sand" */
  colorName?: string;
  /**
   * Andere kleuren van hetzelfde item in de shop van het merk. De voorraadcheck vult
   * en houdt deze lijst bij; zie README.md.
   */
  colorways?: Colorway[];
  description?: string;
  /** Link naar het item in de shop van het merk */
  url?: string;
  /**
   * Datum waarop je het item hebt toegevoegd (YYYY-MM-DD), bepaalt "Nieuw". Mag ook met tijd
   * (bijv. "2026-10-04T20:00:00+02:00"), zodat het boven eerdere items van die dag komt.
   */
  addedAt: string;
  /**
   * Releasemoment als het item nog moet droppen, bijv. "2026-10-18T18:00:00+02:00".
   * Hoort het item bij een drop, dan wordt de datum van de drop gebruikt.
   */
  releaseAt?: string;
  /** id van een drop uit drops.ts */
  drop?: string;
  soldOut?: boolean;
  /** Uitgelicht op de homepage */
  featured?: boolean;
  /** Vrije zoekwoorden, bijv. ["oversized", "heavyweight"] */
  tags?: string[];
}

/** Een andere kleur van een item. Prijs en maten zijn dezelfde als die van het item. */
export interface Colorway {
  /** Kleurnaam zoals de shop hem noemt, bijv. "Navy" of "Blue Check" */
  name: string;
  /** Kleur uit COLORS in taxonomy.ts, voor de kleurfilter */
  color: ColorId;
  /** Link naar deze kleur in de shop van het merk */
  url: string;
  /** Foto's van deze kleur; de eerste is ook het kleurstaal op de productpagina */
  images: string[];
  /** Maten die in deze kleur op zijn */
  soldOutSizes?: string[];
  /** Deze kleur is helemaal uitverkocht */
  soldOut?: boolean;
}

export interface Drop {
  /** Unieke slug, wordt gebruikt in de URL: /drops/<id> */
  id: string;
  /** id van een merk uit brands.ts */
  brand: string;
  title: string;
  /** Moment van de drop inclusief tijdzone, bijv. "2026-10-18T18:00:00+02:00" */
  date: string;
  description?: string;
  /** Waar de drop live gaat (shop, Instagram-post, ...) */
  url?: string;
  /**
   * Eerste foto's van de drop, bijv. uit de Instagram-post of story van het merk. Handig zolang
   * er nog geen items zijn. Zet ze in /public/items/<merk>/: links naar Instagram verlopen.
   */
  previews?: DropPreview[];
  /** De Instagram-post waar `previews` vandaan komen */
  instagramPost?: string;
}

export interface DropPreview {
  /** Pad in /public (bijv. "/items/merk/drop-01.jpg") of externe URL */
  src: string;
  /** Wat er op de foto staat, bijv. "Thermal Zip Hoodie" */
  caption?: string;
}

/**
 * Product verrijkt met merknaam; releaseAt is het effectieve moment (eigen datum of die van
 * de drop) en `colors` bevat ook de kleuren uit `colorways`, zodat de kleurfilter ze vindt.
 */
export interface CatalogItem extends Product {
  brandName: string;
  dropTitle?: string;
}
