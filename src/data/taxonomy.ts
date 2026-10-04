// Vaste lijsten waar je items aan koppelt. Voeg hier gerust categorieën of kleuren
// aan toe; TypeScript zorgt dat items alleen bestaande waarden kunnen gebruiken.

export const CATEGORIES = [
  { id: "tees", label: "T-shirts" },
  { id: "longsleeves", label: "Longsleeves" },
  { id: "hoodies", label: "Hoodies" },
  { id: "sweaters", label: "Sweaters" },
  { id: "knitwear", label: "Knitwear" },
  { id: "shirts", label: "Overhemden" },
  { id: "jackets", label: "Jassen" },
  { id: "pants", label: "Broeken" },
  { id: "jeans", label: "Jeans" },
  { id: "shorts", label: "Shorts" },
  { id: "tracksuits", label: "Trainingspakken" },
  { id: "headwear", label: "Petten & mutsen" },
  { id: "bags", label: "Tassen" },
  { id: "accessories", label: "Accessoires" },
  { id: "footwear", label: "Schoenen" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const COLORS = {
  zwart: { label: "Zwart", swatch: "#141414" },
  wit: { label: "Wit", swatch: "#f6f5f0" },
  creme: { label: "Crème", swatch: "#ece3cf" },
  grijs: { label: "Grijs", swatch: "#9b9b98" },
  beige: { label: "Beige", swatch: "#cdb994" },
  bruin: { label: "Bruin", swatch: "#6b4a32" },
  groen: { label: "Groen", swatch: "#475b3c" },
  lichtblauw: { label: "Lichtblauw", swatch: "#a9c6e3" },
  blauw: { label: "Blauw", swatch: "#2c4f8f" },
  navy: { label: "Navy", swatch: "#1d2640" },
  rood: { label: "Rood", swatch: "#b0261e" },
  roze: { label: "Roze", swatch: "#e7a9bb" },
  paars: { label: "Paars", swatch: "#6a4c8c" },
  geel: { label: "Geel", swatch: "#e5c22e" },
  oranje: { label: "Oranje", swatch: "#e0702a" },
  multi: {
    label: "Multi",
    swatch: "conic-gradient(#b0261e, #e5c22e, #475b3c, #2c4f8f, #6a4c8c, #b0261e)",
  },
} as const;

export type ColorId = keyof typeof COLORS;

// Volgorde waarin maten getoond worden. Onbekende maten komen erachter
// (cijfers oplopend, daarna alfabetisch).
export const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "One size"];

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) {
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  }
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, "nl");
}
