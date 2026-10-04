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
  description?: string;
  /** Link naar het item in de shop van het merk */
  url?: string;
  /** Datum waarop je het item hebt toegevoegd (YYYY-MM-DD), bepaalt "Nieuw" */
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

export interface Drop {
  /** Unieke slug, wordt gebruikt in de URL: /drops/<id> */
  id: string;
  /** id van een merk uit brands.ts */
  brand: string;
  title: string;
  /** Moment van de drop inclusief tijdzone, bijv. "2026-10-18T18:00:00+02:00" */
  date: string;
  description?: string;
  image?: string;
  /** Waar de drop live gaat (shop, Instagram-post, ...) */
  url?: string;
}

/** Product verrijkt met merknaam; releaseAt is het effectieve moment (eigen datum of die van de drop). */
export interface CatalogItem extends Product {
  brandName: string;
  dropTitle?: string;
}
